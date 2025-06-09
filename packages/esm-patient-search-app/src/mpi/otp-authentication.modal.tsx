import React, { useRef, useState, useCallback } from 'react';
import { Button, TextInput, ModalHeader, ModalBody, ModalFooter, InlineLoading } from '@carbon/react';
import { type Consent, type SearchedPatient } from '../types';
import { useTranslation } from 'react-i18next';
import styles from './otp-authentication.scss';
import {
  createPatientPayload,
  searchPatientByNationalId,
  createPatientUpdatePayload,
  addPatientIdentifier,
  sendOtpKhmis,
  generateOTP,
  useHieOtpConfig,
} from './otp-authentication.resource';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { navigate, openmrsFetch, restBaseUrl, showSnackbar, useSession } from '@openmrs/esm-framework';
import { Password } from '@carbon/react/icons';
import { sendOtp, useShaFacilityInfo, validateOtp } from '../hie.resources';
import { HIE_CONSENT } from '../constants';

type OtpStatus = 'idle' | 'loadingOtp' | 'otpSendSuccessful' | 'otpFetchError';

interface OtpAuthenticationModalProps {
  patient: SearchedPatient;
  onClose: () => void;
}

const authFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(HIE_CONSENT.KENYAN_PHONE_REGEX, 'Please enter a valid Kenyan phone number'),
  otp: z.string().min(HIE_CONSENT.OTP_LENGTH, `OTP must be ${HIE_CONSENT.OTP_LENGTH} digits`),
});

type AuthFormData = z.infer<typeof authFormSchema>;

const formatPhoneNumber = (phone: string): string => {
  const cleanNumber = phone.replace(/^\+?254/, '').replace(/^0/, '');
  return `254${cleanNumber}`;
};

const normalizePhoneInput = (value: string): string => {
  return value.replace(/\D/g, '');
};

const getParsedResponse = (response: any) => {
  return typeof response === 'string' ? JSON.parse(response) : response;
};

const useOtpValidation = (
  otpId: string,
  serverOtp: string,
  isHieEnabled: boolean,
  t: (key: string, fallback: string) => string,
) => {
  const [isOtpValid, setIsOtpValid] = useState(false);
  const [otpError, setOtpError] = useState<string>('');
  const [showResendButton, setShowResendButton] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateOtpValue = useCallback(
    async (otp: string) => {
      if (!otp || otp.length < HIE_CONSENT.OTP_LENGTH) {
        setIsOtpValid(false);
        setOtpError('');
        setShowResendButton(false);
        return;
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          let isValid = false;

          if (isHieEnabled) {
            const payload: Partial<Consent> = { id: otpId, otp };
            const result = await validateOtp(payload);
            const parsedResponse = getParsedResponse(result.response);
            isValid = parsedResponse?.status === 'success';
          } else {
            isValid = serverOtp === otp && otp.length === HIE_CONSENT.OTP_LENGTH;
          }

          setIsOtpValid(isValid);
          setOtpError(isValid ? '' : t('invalidOtp', 'Invalid OTP. Please check and try again.'));
          setShowResendButton(!isValid);
        } catch (error) {
          console.error('OTP validation error:', error);
          setIsOtpValid(false);
          setOtpError(t('invalidOtp', 'Invalid OTP. Please check and try again.'));
          setShowResendButton(true);
        }
      }, HIE_CONSENT.OTP_VALIDATION_DEBOUNCE);
    },
    [otpId, serverOtp, isHieEnabled, t],
  );

  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOtpValid,
    otpError,
    showResendButton,
    validateOtpValue,
  };
};

const OtpAuthenticationModal: React.FC<OtpAuthenticationModalProps> = ({ patient, onClose }) => {
  const { t } = useTranslation();
  const session = useSession();

  const patientPhoneNumber =
    (patient.attributes?.find((attribute) => attribute.attributeType.display === 'phone')?.value as string) ?? '';

  const patientIdNumber =
    (patient?.identifiers?.find((id) => id.identifierType.display === 'National ID')?.identifier as string) ?? '';

  const [otpStatus, setOtpStatus] = useState<OtpStatus>('idle');
  const [isRegistering, setIsRegistering] = useState(false);
  const [otpId, setOtpId] = useState<string>('');
  const [serverOtp, setServerOtp] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
    setValue,
  } = useForm<AuthFormData>({
    mode: 'all',
    defaultValues: {
      phoneNumber: formatPhoneNumber(patientPhoneNumber),
      otp: '',
    },
    resolver: zodResolver(authFormSchema),
  });

  const { shaFacility, isLoading: isShaFacilityLoading, error: shaFacilityError } = useShaFacilityInfo(true);

  const { otpResource } = useHieOtpConfig('kenyaemr.hie.registry.otp.source');

  const isHieEnabled = otpResource == 'hie';

  const watchOtp = watch('otp');
  const { isOtpValid, otpError, showResendButton, validateOtpValue } = useOtpValidation(
    otpId,
    serverOtp,
    isHieEnabled,
    t,
  );

  React.useEffect(() => {
    validateOtpValue(watchOtp);
  }, [watchOtp, validateOtpValue]);

  const handleRequestOtp = async () => {
    const formData = getValues();
    const formattedPhoneNumber = formatPhoneNumber(formData.phoneNumber);
    const payload: Partial<Consent> = {
      identifierType: HIE_CONSENT.NATIONAL_ID,
      identifierNumber: patientIdNumber,
      phoneNumber: formattedPhoneNumber,
      facility: shaFacility.facilityRegistryCode,
      scope: [HIE_CONSENT.CLIENT_REGISTRY, HIE_CONSENT.SHARED_HEALTH_RECORD],
    };

    try {
      setOtpStatus('loadingOtp');
      const response = await sendOtp(payload);
      const parsedResponse = getParsedResponse(response.response);
      const status = parsedResponse?.status;
      const requestId = parsedResponse?.id;

      if (status === 'success') {
        setValue('otp', '');
        setOtpId(requestId);
        setOtpStatus('otpSendSuccessful');

        showSnackbar({
          title: t('otpSent', 'OTP Sent'),
          subtitle: t('otpSentSubtitle', 'Please check your phone for the OTP'),
          kind: 'success',
          isLowContrast: true,
        });
      } else {
        throw new Error('OTP send failed');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      setOtpStatus('otpFetchError');
      showSnackbar({
        title: t('otpSendFailed', 'Failed to send OTP'),
        subtitle: t('otpSendFailedSubtitle', 'Please try again or contact support'),
        kind: 'error',
        isLowContrast: true,
      });
    }
  };

  const handleRequestOtpKhmis = async () => {
    try {
      setOtpStatus('loadingOtp');
      const otp = generateOTP(HIE_CONSENT.OTP_LENGTH);
      setServerOtp(otp);
      setValue('otp', '');

      const formData = getValues();
      const formattedPhoneNumber = formatPhoneNumber(formData.phoneNumber);
      await sendOtpKhmis({ receiver: formattedPhoneNumber, otp }, patient.person.personName.display);

      setOtpStatus('otpSendSuccessful');
      showSnackbar({
        title: t('otpSent', 'OTP Sent'),
        subtitle: t('otpSentSubtitle', 'Please check your phone for the OTP'),
        kind: 'success',
        isLowContrast: true,
      });
    } catch (error) {
      console.error('KHMIS OTP request error:', error);
      setOtpStatus('otpFetchError');
      showSnackbar({
        title: t('otpSendFailed', 'Failed to send OTP'),
        subtitle: t('otpSendFailedSubtitle', 'Please try again or contact support'),
        kind: 'error',
        isLowContrast: true,
      });
    }
  };

  const handleOtpRequest = isHieEnabled ? handleRequestOtp : handleRequestOtpKhmis;

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const normalizedValue = normalizePhoneInput(e.target.value);
    onChange(normalizedValue);
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, HIE_CONSENT.OTP_LENGTH);
    onChange(value);
  };

  const handlePatientRegistrationAndNavigateToPatientChart = async () => {
    setIsRegistering(true);
    try {
      const localPatient = await searchPatientByNationalId(patient.identifiers[0].identifier);
      const isUpdate = Boolean(localPatient?.uuid);

      const patientPayload = isUpdate
        ? await createPatientUpdatePayload(localPatient, patient)
        : await createPatientPayload(patient);

      const patientRegistrationUrl = isUpdate
        ? `${restBaseUrl}/patient/${localPatient.uuid}`
        : `${restBaseUrl}/patient`;

      const patientToCreateOrUpdate = isUpdate ? { person: patientPayload.person } : patientPayload;

      const registeredPatient = await openmrsFetch(patientRegistrationUrl, {
        method: 'POST',
        body: patientToCreateOrUpdate,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (isUpdate && patientPayload?.identifiers?.[0]) {
        await addPatientIdentifier(localPatient.uuid, JSON.stringify(patientPayload.identifiers[0]));
      }

      if (!registeredPatient?.data?.uuid) {
        throw new Error('Patient registration failed - no UUID returned');
      }

      showSnackbar({
        title: t(isUpdate ? 'patientUpdated' : 'patientCreated', isUpdate ? 'Patient Updated' : 'Patient Created'),
        subtitle: t(
          isUpdate ? 'patientUpdatedSubtitle' : 'patientCreatedSubtitle',
          isUpdate ? 'Patient has been successfully updated' : 'Patient has been successfully created',
        ),
        kind: 'success',
        isLowContrast: true,
      });

      navigate({ to: `\${openmrsSpaBase}/patient/${registeredPatient.data.uuid}/chart` });
      onClose();
    } catch (error) {
      console.error('Patient registration error:', error);
      showSnackbar({
        title: t('patientSaveFailed', 'Failed to save patient'),
        subtitle: t('patientSaveFailedSubtitle', error?.message || 'An unexpected error occurred. Please try again'),
        kind: 'error',
        isLowContrast: true,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const isOtpRequestDisabled = otpStatus === 'loadingOtp';
  const isContinueDisabled = (!isOtpValid && otpStatus !== 'otpSendSuccessful') || isRegistering;

  return (
    <div>
      <ModalHeader closeModal={onClose} title={t('otpVerification', 'OTP Verification')} />
      <ModalBody>
        {patientPhoneNumber ? (
          <div className={styles.otpForm}>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field }) => (
                <TextInput
                  labelText={t('phoneNumber', 'Phone Number')}
                  placeholder="Enter Phone Number e.g. 0717417867"
                  invalidText={
                    errors.phoneNumber?.message || t('phoneNumberInvalid', 'Please enter a valid phone number')
                  }
                  invalid={!!errors.phoneNumber}
                  {...field}
                  onChange={(e) => handlePhoneInput(e, field.onChange)}
                />
              )}
            />

            <Controller
              control={control}
              name="otp"
              render={({ field }) => (
                <TextInput
                  labelText={t('otp', 'OTP')}
                  placeholder={`Enter ${HIE_CONSENT.OTP_LENGTH}-digit OTP`}
                  disabled={otpStatus !== 'otpSendSuccessful'}
                  invalid={!!otpError}
                  invalidText={otpError}
                  {...field}
                  onChange={(e) => handleOtpInput(e, field.onChange)}
                />
              )}
            />

            <div className={styles.otpButtonContainer}>
              <Button
                size="sm"
                kind="tertiary"
                renderIcon={Password}
                onClick={handleOtpRequest}
                disabled={isOtpRequestDisabled}>
                {otpStatus === 'loadingOtp' && <InlineLoading />}
                {otpStatus === 'loadingOtp'
                  ? t('sending', 'Sending...')
                  : showResendButton
                    ? t('resendOtp', 'Resend OTP')
                    : t('requestOtp', 'Request OTP')}
              </Button>
            </div>
          </div>
        ) : (
          <p>
            {t(
              'failureVerifyingPatient',
              'Verification failed. Patient missing phone number. Kindly advise patient to update their details on Afya Yangu and try again.',
            )}
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button kind="secondary" onClick={onClose}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button onClick={handlePatientRegistrationAndNavigateToPatientChart} disabled={isContinueDisabled}>
          {isRegistering && <InlineLoading />}
          {isRegistering ? t('saving', 'Saving...') : t('continueToChart', 'Continue to Chart')}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default OtpAuthenticationModal;
