import { Accordion, AccordionItem, CodeSnippet } from '@carbon/react';
import { age, ExtensionSlot, formatDate } from '@openmrs/esm-framework';
import capitalize from 'lodash-es/capitalize';
import React from 'react';
import { useTranslation } from 'react-i18next';
import DependentInfo from '../dependants/dependants.component';
import { getPatientName, maskData } from '../hie-resource';
import PatientInfo from '../patient-info/patient-info.component';
import styles from './confirm-hie.scss';

type HIEPatientDetailPreviewProps = {
  patient: fhir.Patient;
};

const HIEPatientDetailPreview: React.FC<HIEPatientDetailPreviewProps> = ({ patient }) => {
  const { familyName, givenName, middleName } = getPatientName(patient);
  const { t } = useTranslation();
  const getidentifier = (code: string) =>
    patient?.identifier?.find((identifier) => identifier?.type?.coding?.some((coding) => coding?.code === code));

  return (
    <>
      <div className={styles.patientDetails}>
        <ExtensionSlot
          className={styles.patientPhotoContainer}
          name="patient-photo-slot"
          state={{ patientName: `${maskData(givenName)} . ${maskData(middleName)} . ${maskData(familyName)}` }}
        />
        <div className={styles.patientInfoContainer}>
          <PatientInfo label={t('healthID', 'HealthID')} value={getidentifier('SHA-number')?.value} />
          <PatientInfo
            label={t('patientName', 'Patient name')}
            customValue={
              <span className={styles.patientNameValue}>
                <p>{maskData(givenName)}</p>
                <span>&bull;</span>
                <p>{maskData(middleName)}</p>
                <span>&bull;</span>
                <p>{maskData(familyName)}</p>
              </span>
            }
          />

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
    </>
  );
};

export default HIEPatientDetailPreview;
