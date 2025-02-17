import React, { useState } from 'react';
import { Button, TextInput, ModalHeader, ModalBody, ModalFooter } from '@carbon/react';
import { type SearchedPatient } from '../types';
import { useTranslation } from 'react-i18next';
import styles from './otp-authentication.scss';
import {
  createPatientPayload,
  generateOTP,
  searchPatientByNationalId,
  sendOtp,
  createPatientUpdatePayload,
  addPatientIdentifier,
} from './otp-authentication.resource';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { navigate, openmrsFetch, restBaseUrl, showSnackbar, useSession } from '@openmrs/esm-framework';
import { Password } from '@carbon/react/icons';

const authFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^(?:\+254|254|0)\d{9}$/, 'Please enter a valid Kenyan phone number'),
  otp: z.string().min(5, 'OTP must be 5 digits'),
});

const formatPhoneNumber = (phone: string): string => {
  // Remove any existing '+' or country code
  let cleanNumber = phone.replace(/^\+?254/, '').replace(/^0/, '');
  return `+254${cleanNumber}`;
};

const normalizePhoneInput = (value: string): string => {
  // Remove all non-digit characters
  return value.replace(/\D/g, '');
};

const OtpAuthenticationModal: React.FC<{ patient: SearchedPatient; onClose: () => void }> = ({ patient, onClose }) => {
  const { t } = useTranslation();
  const session = useSession();
  const patientPhoneNumber =
    (patient.attributes?.find((attribute) => attribute.attributeType.display === 'phone')?.value as string) ?? '';
  const [serverOtp, setServerOtp] = useState<string>('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'loadingOtp' | 'otpSendSuccessfull' | 'otpFetchError'>('idle');
  const [isOtpValid, setIsOtpValid] = useState(false);
  const [otpError, setOtpError] = useState<string>('');
  const [showResendButton, setShowResendButton] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
    setValue,
  } = useForm<z.infer<typeof authFormSchema>>({
    mode: 'all',
    defaultValues: { phoneNumber: formatPhoneNumber(patientPhoneNumber), otp: '' },
    resolver: zodResolver(authFormSchema),
  });

  // Watch the OTP input to validate it in real-time
  const watchOtp = watch('otp');
  React.useEffect(() => {
    if (serverOtp && watchOtp) {
      const isValid = serverOtp === watchOtp;
      setIsOtpValid(isValid);

      if (watchOtp.length === 5) {
        if (!isValid) {
          setOtpError(t('invalidOtp', 'Invalid OTP. Please check and try again.'));
          setShowResendButton(true);
        } else {
          setOtpError('');
          setShowResendButton(false);
        }
      } else {
        setOtpError('');
        setShowResendButton(false);
      }
    } else {
      setIsOtpValid(false);
      setOtpError('');
      setShowResendButton(false);
    }
  }, [watchOtp, serverOtp, t]);

  const handleClose = () => {
    onClose();
  };

  const handleRequestOtp = async () => {
    try {
      const otp = generateOTP(5);
      setServerOtp(otp);
      setOtpStatus('loadingOtp');
      setValue('otp', '');
      setOtpError('');
      setShowResendButton(false);

      const formData = getValues();
      const formattedPhoneNumber = formatPhoneNumber(formData.phoneNumber);
      await sendOtp({ receiver: formattedPhoneNumber, otp }, patient.person.personName.display);

      setOtpStatus('otpSendSuccessfull');
      showSnackbar({
        title: t('otpSent', 'OTP Sent'),
        subtitle: t('otpSentSubtitle', 'Please check your phone for the OTP'),
        kind: 'success',
        isLowContrast: true,
      });
    } catch (error) {
      setOtpStatus('otpFetchError');
      showSnackbar({
        title: t('otpSendFailed', 'Failed to send OTP'),
        subtitle: t('otpSendFailedSubtitle', 'Please check your phone for the OTP'),
        kind: 'error',
        isLowContrast: true,
      });
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const normalizedValue = normalizePhoneInput(e.target.value);
    onChange(normalizedValue);
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
    onChange(value);
  };

  const handlePatientRegistrationAndNavigateToPatientChart = async () => {
    setIsRegistering(true);
    try {
      const localPatient = await searchPatientByNationalId(patient.identifiers[0].identifier);
      const isUpdate = Boolean(localPatient?.uuid);

      let patientPayload = isUpdate
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

      if (isUpdate) {
        await addPatientIdentifier(localPatient.uuid, JSON.stringify(patientPayload?.identifiers[0]));
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
                  placeholder="Enter 5-digit OTP"
                  disabled={otpStatus !== 'otpSendSuccessfull'}
                  invalid={!!otpError}
                  invalidText={otpError}
                  {...field}
                  onChange={(e) => handleOtpInput(e, field.onChange)}
                />
              )}
            />
            <Button
              size="sm"
              kind="tertiary"
              renderIcon={Password}
              onClick={handleRequestOtp}
              disabled={otpStatus === 'loadingOtp'}>
              {otpStatus === 'loadingOtp'
                ? t('sending', 'Sending...')
                : showResendButton
                  ? t('resendOtp', 'Resend OTP')
                  : t('requestOtp', 'Request OTP')}
            </Button>
          </div>
        ) : (
          <p>
            {t(
              'faulureVerifyingPatient',
              'Verification failed. Patient missing phone number.Kindly advice patient to Update their details on Afya Yangu and try again',
            )}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={handleClose}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button
          onClick={handlePatientRegistrationAndNavigateToPatientChart}
          disabled={(!isOtpValid && otpStatus !== 'otpSendSuccessfull') || isRegistering}>
          {isRegistering ? t('saving', 'Saving...') : t('continueToChart', 'Continue to Chart')}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default OtpAuthenticationModal;
