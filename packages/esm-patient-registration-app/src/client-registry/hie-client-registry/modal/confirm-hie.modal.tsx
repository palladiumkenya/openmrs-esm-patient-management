import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type HIEPatient } from '../hie-types';
import styles from './confirm-hie.scss';
import { authorizationFormSchema, generateOTP, getPatientName, persistOTP, sendOtp, verifyOtp } from '../hie-resource';
import HIEPatientDetailPreview from './hie-patient-detail-preview.component';
import HIEOTPVerficationForm from './hie-otp-verification-form.component';
import { Form } from '@carbon/react';
import { FormProvider, useForm } from 'react-hook-form';
import { type z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { showSnackbar } from '@openmrs/esm-framework';

const PatientInfo: React.FC<{ label: string; value: string | (() => React.ReactNode) }> = ({ label, value }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '0.25fr 0.75fr', margin: '0.25rem' }}>
      <span style={{ minWidth: '5rem', fontWeight: 'bold' }}>{label}</span>
      <span>{typeof value === 'function' ? value() : value}</span>
    </div>
  );
};

interface HIEConfirmationModalProps {
  closeModal: () => void;
  patient: HIEPatient;
  onUseValues: () => void;
}

const HIEConfirmationModal: React.FC<HIEConfirmationModalProps> = ({ closeModal, patient, onUseValues }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'authorization' | 'preview'>('preview');
  const [status, setStatus] = useState<'loadingOtp' | 'otpSendSuccessfull' | 'otpFetchError'>();
  const phoneNumber = patient?.telecom?.find((num) => num.value)?.value;
  const getidentifier = (code: string) =>
    patient?.identifier?.find((identifier) => identifier?.type?.coding?.some((coding) => coding?.code === code));
  const patientId = patient?.id ?? getidentifier('SHA-number')?.value;
  const form = useForm<z.infer<typeof authorizationFormSchema>>({
    defaultValues: {
      receiver: phoneNumber,
    },
    resolver: zodResolver(authorizationFormSchema),
  });
  const patientName = getPatientName(patient);

  const onSubmit = async (values: z.infer<typeof authorizationFormSchema>) => {
    try {
      verifyOtp(values.otp, patientId);
      showSnackbar({ title: 'Success', kind: 'success', subtitle: 'Access granted successfully' });
      onUseValues();
      closeModal();
    } catch (error) {
      showSnackbar({ title: 'Faulure', kind: 'error', subtitle: `${error}` });
    }
  };

  return (
    <FormProvider {...form}>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <ModalHeader closeModal={closeModal}>
          <span className={styles.header}>
            {mode === 'authorization'
              ? t('hiePatientVerification', 'HIE Patient Verification')
              : t('hieModal', 'HIE Patient Record Found')}
          </span>
        </ModalHeader>
        <ModalBody>
          {mode === 'authorization' ? (
            <HIEOTPVerficationForm
              name={`${patientName.givenName} ${patientName.middleName}`}
              patientId={patientId}
              status={status}
              setStatus={setStatus}
            />
          ) : (
            <HIEPatientDetailPreview patient={patient} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={closeModal}>
            {t('cancel', 'Cancel')}
          </Button>

          {mode === 'preview' && (
            <Button onClick={() => setMode('authorization')} kind="primary">
              {t('useValues', 'Use values')}
            </Button>
          )}
          {mode === 'authorization' && (
            <Button
              kind="primary"
              type="submit"
              disabled={form.formState.isSubmitting || status !== 'otpSendSuccessfull'}>
              {t('verifyAndUseValues', 'Verify & Use values')}
            </Button>
          )}
        </ModalFooter>
      </Form>
    </FormProvider>
  );
};

export default HIEConfirmationModal;
function onVerificationSuccesfull() {
  throw new Error('Function not implemented.');
}
