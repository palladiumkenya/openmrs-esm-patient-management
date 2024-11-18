import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalBody, ModalHeader, ModalFooter, Accordion, AccordionItem, CodeSnippet } from '@carbon/react';
import { age, ExtensionSlot, formatDate } from '@openmrs/esm-framework';
import { type HIEPatient } from '../hie-types';
import capitalize from 'lodash-es/capitalize';
import styles from './confirm-hie.scss';

const PatientInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div className={styles.patientInfo}>
      <span className={styles.patientInfoLabel}>{label}</span>
      <span>{value || '--'}</span>
    </div>
  );
};

const DependentInfo: React.FC<{ dependents: any[] }> = ({ dependents }) => {
  const { t } = useTranslation();

  if (dependents && dependents.length > 0) {
    return (
      <div>
        <span className={styles.header}>{t('dependants', 'Dependants')}</span>
        {dependents.map((dependent, index) => {
          const name = dependent?.name?.text;
          const relationship =
            dependent?.relationship?.[0]?.coding?.[0]?.display || t('unknownRelationship', 'Unknown');
          const nationalID = dependent?.extension?.find(
            (ext) =>
              ext.url === 'http://cr.tiberbu.app/fhir/StructureDefinition/dependants-id-number' &&
              ext.valueIdentifier?.type?.coding?.[0]?.code === 'national-id',
          )?.valueIdentifier?.value;
          const birthCertificate = dependent?.extension?.find(
            (ext) =>
              ext.url === 'http://cr.tiberbu.app/fhir/StructureDefinition/dependants-id-number' &&
              ext.valueIdentifier?.type?.coding?.[0]?.code === 'birth-certificate-number',
          )?.valueIdentifier?.value;

          const primaryIdentifier = nationalID || birthCertificate;
          const identifierLabel = nationalID
            ? t('nationalID', 'National ID')
            : t('birthCertificate', 'Birth Certificate');

          return (
            <div key={index} className={styles.dependentInfo}>
              <PatientInfo label={t('name', 'Name')} value={name} />
              <PatientInfo label={t('relationship', 'Relationship')} value={relationship} />
              <PatientInfo label={identifierLabel} value={primaryIdentifier} />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};

interface HIEConfirmationModalProps {
  closeModal: () => void;
  patient: HIEPatient;
  onUseValues: () => void;
}

const HIEConfirmationModal: React.FC<HIEConfirmationModalProps> = ({ closeModal, patient, onUseValues }) => {
  const { t } = useTranslation();
  const firstName = patient?.name[0]?.given?.[0];
  const lastName = patient?.name[0]?.family;

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
        <div className={styles.patientDetails}>
          <ExtensionSlot
            className={styles.patientPhotoContainer}
            name="patient-photo-slot"
            state={{ patientName: `${firstName} ${lastName}` }}
          />
          <div className={styles.patientInfoContainer}>
            <PatientInfo label={t('healthID', 'HealthID')} value={patient?.id} />
            <PatientInfo label={t('patientName', 'Patient name')} value={`${firstName} ${lastName}`} />
            <PatientInfo label={t('age', 'Age')} value={age(patient?.birthDate)} />
            <PatientInfo label={t('dateOfBirth', 'Date of birth')} value={formatDate(new Date(patient?.birthDate))} />
            <PatientInfo label={t('gender', 'Gender')} value={capitalize(patient?.gender)} />
            <PatientInfo
              label={t('maritalStatus', 'Marital status')}
              value={patient?.maritalStatus?.coding?.map((m) => m.code).join('')}
            />

            {(!patient?.contact || patient?.contact.length === 0) && (
              <PatientInfo label={t('dependents', 'Dependents')} value="--" />
            )}
          </div>
        </div>

        <DependentInfo dependents={patient?.contact} />

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
