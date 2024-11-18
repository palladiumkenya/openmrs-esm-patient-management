import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../modal/confirm-hie.scss';
import PatientInfo from '../patient-info/patient-info.component';

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

export default DependentInfo;
