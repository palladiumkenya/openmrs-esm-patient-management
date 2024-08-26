import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalBody, ModalHeader, ModalFooter, Accordion, AccordionItem, CodeSnippet } from '@carbon/react';
import styles from './confirm-hie.scss';
import { age, ExtensionSlot, formatDate } from '@openmrs/esm-framework';
import { type HIEPatient } from '../hie-types';
import capitalize from 'lodash-es/capitalize';

const PatientInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '0.25fr 0.75fr', margin: '0.25rem' }}>
      <span style={{ minWidth: '5rem', fontWeight: 'bold' }}>{label}</span>
      <span>{value}</span>
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
  const firstName = patient?.name[0]['given']?.[0];
  const lastName = patient?.name[0]['family'];

  const handleUseValues = () => {
    onUseValues();
    closeModal();
  };

  return (
    <div>
      <ModalHeader closeModal={closeModal}>
        <span className={styles.header}>{t('hieModal', 'HIE Patient Record Found')}</span>
      </ModalHeader>
      <ModalBody>
        <div style={{ display: 'flex', margin: '1rem' }}>
          <ExtensionSlot
            style={{ display: 'flex', alignItems: 'center' }}
            name="patient-photo-slot"
            state={{ patientName: `${firstName} ${lastName}` }}
          />
          <div style={{ width: '100%', marginLeft: '0.625rem' }}>
            <PatientInfo label={t('healthID', 'HealthID')} value={patient.id} />
            <PatientInfo label={t('patientName', 'Patient name')} value={`${firstName} ${lastName}`} />
            <PatientInfo label={t('age', 'Age')} value={age(patient?.birthDate)} />
            <PatientInfo label={t('dateOfBirth', 'Date of birth')} value={formatDate(new Date(patient?.birthDate))} />
            <PatientInfo label={t('gender', 'Gender')} value={capitalize(patient?.gender)} />
            <PatientInfo
              label={t('maritalStatus', 'Marital status')}
              value={patient.maritalStatus.coding.map((m) => m.code).join('')}
            />
            <PatientInfo label={t('dependents', 'Dependents')} value="--" />
          </div>
        </div>
        <div>
          <Accordion>
            <AccordionItem title={t('viewFullResponse', 'View full response')}>
              <CodeSnippet type="multi" feedback="Copied to clipboard">
                {JSON.stringify(patient, null, 2)}
              </CodeSnippet>
            </AccordionItem>
          </Accordion>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('cancel', 'Cancel')}
        </Button>

        <Button onClick={handleUseValues} kind="primary">
          {t('useValues', 'Use values')}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default HIEConfirmationModal;
