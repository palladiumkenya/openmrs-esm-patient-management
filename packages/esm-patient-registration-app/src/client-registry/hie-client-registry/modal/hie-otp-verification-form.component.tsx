import { Button, Column, Row, Stack, Tag, TextInput, InlineLoading } from '@carbon/react';
import { showSnackbar } from '@openmrs/esm-framework';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type authorizationFormSchema, generateOTP, persistOTP, sendOtp } from '../hie-resource';
import styles from './confirm-hie.scss';
import { type z } from 'zod';

type HIEOTPVerficationFormProps = {
  name: string;
  patientId: string;
  status?: 'loadingOtp' | 'otpSendSuccessfull' | 'otpFetchError';
  setStatus: React.Dispatch<React.SetStateAction<'loadingOtp' | 'otpSendSuccessfull' | 'otpFetchError'>>;
};

const HIEOTPVerficationForm: React.FC<HIEOTPVerficationFormProps> = ({ name, patientId, setStatus, status }) => {
  const form = useFormContext<z.infer<typeof authorizationFormSchema>>();
  const { t } = useTranslation();

  const handleGetOTP = async () => {
    try {
      setStatus('loadingOtp');
      const otp = generateOTP(5);
      await sendOtp({ otp, receiver: form.watch('receiver') }, name);
      setStatus('otpSendSuccessfull');
      persistOTP(otp, patientId);
    } catch (error) {
      setStatus('otpFetchError');
      showSnackbar({ title: t('error', 'Error'), kind: 'error', subtitle: error?.message });
    }
  };

  return (
    <Stack gap={4} className={styles.grid}>
      <Column>
        <Controller
          control={form.control}
          name="receiver"
          render={({ field }) => (
            <TextInput
              invalid={form.formState.errors[field.name]?.message}
              invalidText={form.formState.errors[field.name]?.message}
              {...field}
              placeholder={t('patientPhoneNUmber', 'Patient Phone number')}
              labelText={t('patientPhoneNUmber', 'Patient Phone number')}
              helperText={t('phoneNumberHelper', 'Patient will receive OTP on this number')}
            />
          )}
        />
      </Column>

      <Column>
        <Controller
          control={form.control}
          name="otp"
          render={({ field }) => (
            <Row className={styles.otpInputRow}>
              <TextInput
                invalid={form.formState.errors[field.name]?.message}
                invalidText={form.formState.errors[field.name]?.message}
                {...field}
                placeholder={t('otpCode', 'OTP Authorization code')}
                labelText={t('otpCode', 'OTP Authorization code')}
              />
              <Button
                onClick={handleGetOTP}
                role="button"
                type="blue"
                kind="tertiary"
                disabled={['loadingOtp', 'otpSendSuccessfull'].includes(status)}>
                {status === 'loadingOtp' ? (
                  <InlineLoading status="active" iconDescription="Loading" description="Loading data..." />
                ) : status === 'otpFetchError' ? (
                  t('retry', 'Retry')
                ) : (
                  t('verifyOTP', 'Verify with OTP')
                )}
              </Button>
            </Row>
          )}
        />
      </Column>
    </Stack>
  );
};

export default HIEOTPVerficationForm;
