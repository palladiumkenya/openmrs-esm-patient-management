import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  getPatientName,
  navigate,
  openmrsFetch,
  PatientBannerPatientInfo,
  PatientPhoto,
  restBaseUrl,
  showSnackbar,
  useSession,
} from '@openmrs/esm-framework';
import { ModalHeader, ModalBody, Button, InlineLoading, InlineNotification, CodeSnippet } from '@carbon/react';
import styles from './hie.sync.scss';
import { addPatientIdentifier, createPatientUpdatePayloadFromFhir, useHIEPatient } from './otp-authentication.resource';

type HieSycModalProps = {
  onClose: () => void;
  localPatient: fhir.Patient;
  patientUuid: string;
  identifier: fhir.Identifier;
};

const HieSycModal: React.FC<HieSycModalProps> = ({ onClose, localPatient, identifier }) => {
  const { t } = useTranslation();
  const session = useSession();
  const identifierType = identifier.type?.text ?? 'National ID';
  const { data: hiePatient, isLoading, error } = useHIEPatient(identifier.value, identifierType);

  const differences = hiePatient ? comparePatients(localPatient, hiePatient) : null;

  const handleClose = () => {
    onClose();
  };

  const handleProceedToPatientChart = () => {
    onClose();
    navigate({ to: `${window['getOpenmrsSpaBase']()}patient/${localPatient.id}/chart` });
  };

  const handleSyncAndContinueToChart = async () => {
    onClose();

    if (!hiePatient) {
      navigate({ to: `${window['getOpenmrsSpaBase']()}patient/${localPatient.id}/chart` });
    }

    try {
      const payload = createPatientUpdatePayloadFromFhir(localPatient, hiePatient, session?.sessionLocation?.uuid);

      // Update patient information (excluding identifiers)
      const patientUpdatePayload = { ...payload };
      delete patientUpdatePayload.identifiers;

      if (Object.keys(patientUpdatePayload).length > 0) {
        const patientRegistrationUrl = `${restBaseUrl}/patient/${localPatient.id}`;
        await openmrsFetch(patientRegistrationUrl, {
          method: 'POST',
          body: patientUpdatePayload,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Add identifiers separately if they exist
      if (payload?.identifiers && payload.identifiers.length > 0) {
        for (const identifier of payload.identifiers) {
          await addPatientIdentifier(localPatient.id, identifier);
        }
      }

      showSnackbar({
        title: t('patientUpdated', 'Patient Updated'),
        subtitle: t('patientUpdatedSubtitle', 'Patient has been successfully updated'),
        kind: 'success',
      });
      navigate({ to: `${window['getOpenmrsSpaBase']()}patient/${localPatient.id}/chart` });
    } catch (error) {
      showSnackbar({
        title: t('syncError', 'Sync Error'),
        subtitle: t('syncErrorSubtitle', 'An error occurred while syncing the patient'),
        kind: 'error',
      });
      // Continue to patient chart to ensure medical services are not interrupted
      navigate({ to: `${window['getOpenmrsSpaBase']()}patient/${localPatient.id}/chart` });
    }
  };

  const syncButtonText = hiePatient
    ? t('syncAndContinueToChart', 'Sync and Continue to Chart')
    : t('continueToChart', 'Continue to Chart');

  return (
    <div className={styles.modalWrapper}>
      <ModalHeader closeModal={handleClose}>
        <span className={styles.header}>{t('patientInformationSync', 'Patient Information Sync')}</span>
      </ModalHeader>
      <ModalBody>
        <div className={styles.modalBody}>
          <div>
            <h5>{t('localPatient', 'Local Patient')}</h5>
            <PatientInfo patient={localPatient} />
          </div>

          <div>
            <h5>{t('hiePatient', 'HIE Patient')}</h5>
            <HiePatientInfo isLoading={isLoading} error={error} hiePatient={hiePatient} />
          </div>
        </div>
        {Object.keys(differences ?? {}).length > 0 && (
          <InlineNotification
            kind="warning-alt"
            lowContrast
            title={t('differencesFound', 'Differences found')}
            subtitle={t(
              'differencesFoundSubtitle',
              `The patient information in our system differs from the HIE record. Please review these differences before proceeding, if you proceed with the sync operation, the patient information in our system will be updated to match the HIE record. If you choose to Proceed to patient chart, you will be redirected to the patient chart. We will not proceed with the sync operation.`,
            )}
          />
        )}
        {/* {Object.keys(differences ?? {}).length > 0 && (
          <CodeSnippet type="multi" feedback="Copied to clipboard">
            {JSON.stringify(differences, null, 2)}
          </CodeSnippet>
        )} */}

        <div className={styles.actionButtons}>
          <Button kind="danger" onClick={handleClose}>
            {t('cancel', 'Cancel')}
          </Button>
          {hiePatient && Object.keys(differences ?? {}).length > 0 && (
            <Button onClick={handleProceedToPatientChart} kind="secondary">
              {t('proceedToPatientChart', 'Proceed to patient chart')}
            </Button>
          )}
          <Button disabled={isLoading} kind="primary" onClick={handleSyncAndContinueToChart}>
            {syncButtonText}
          </Button>
        </div>
      </ModalBody>
    </div>
  );
};

export default HieSycModal;

const HiePatientInfo: React.FC<{ isLoading: boolean; error: Error | null; hiePatient: fhir.Patient | null }> = ({
  isLoading,
  error,
  hiePatient,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <InlineLoading description="Loading" iconDescription="Loading data..." />;
  }

  if (error) {
    return (
      <InlineNotification
        aria-label="closes notification"
        kind="error"
        lowContrast
        statusIconDescription="notification"
        subtitle={t('hieErrorSubtitle', 'Error while fetching patient information from HIE')}
        title={t('hieErrorTitle', 'HIE Patient Information Error')}
      />
    );
  }

  if (!hiePatient) {
    return (
      <InlineNotification
        className={styles.hiePatientNotFound}
        aria-label="closes notification"
        kind="warning-alt"
        lowContrast
        statusIconDescription="notification"
        subtitle={t(
          'hiePatientNotFoundSubtitle',
          'Please check the identifier and try again, in the event that the patient is not found, please advice the patient to register with Social Health Authority (SHA)',
        )}
        title={t('hiePatientNotFoundTitle', 'HIE Patient Information Not Found')}
      />
    );
  }

  return <div>{hiePatient && <PatientInfo patient={hiePatient} />}</div>;
};

const PatientInfo: React.FC<{ patient: fhir.Patient }> = ({ patient }) => {
  const patientName = getPatientName(patient);
  return (
    <div className={styles.patientInfo}>
      <PatientPhoto patientUuid={patient.id} patientName={patientName} />
      <PatientBannerPatientInfo patient={patient} />
    </div>
  );
};

/**
 * Compares two FHIR Patient resources and returns differences in specific fields
 * @param {Object} localPatient - The local patient resource
 * @param {Object} hiePatient - The HIE patient resource
 * @returns {Object} Object containing differences between the patients
 */
function comparePatients(localPatient, hiePatient) {
  const differences: Record<string, unknown> = {};

  // Compare name components
  const localName = localPatient.name?.[0] as fhir.HumanName | undefined;
  const hieName = hiePatient.name?.[0] as fhir.HumanName | undefined;

  if (localName || hieName) {
    interface NameDiffs {
      family?: { local: string | undefined; hie: string | undefined };
      given?: { local: string[]; hie: string[] };
      prefix?: { local: string[]; hie: string[] };
      suffix?: { local: string[]; hie: string[] };
    }

    const nameDiffs: NameDiffs = {};

    // Compare family name
    if (localName?.family !== hieName?.family) {
      nameDiffs.family = { local: localName?.family, hie: hieName?.family };
    }

    // Compare given names (array of strings)
    const localGiven = localName?.given || [];
    const hieGiven = hieName?.given || [];
    if (JSON.stringify(localGiven) !== JSON.stringify(hieGiven)) {
      nameDiffs.given = { local: localGiven, hie: hieGiven };
    }

    // Compare prefix
    const localPrefix = localName?.prefix || [];
    const hiePrefix = hieName?.prefix || [];
    if (JSON.stringify(localPrefix) !== JSON.stringify(hiePrefix)) {
      nameDiffs.prefix = { local: localPrefix, hie: hiePrefix };
    }

    // Compare suffix
    const localSuffix = localName?.suffix || [];
    const hieSuffix = hieName?.suffix || [];
    if (JSON.stringify(localSuffix) !== JSON.stringify(hieSuffix)) {
      nameDiffs.suffix = { local: localSuffix, hie: hieSuffix };
    }

    if (Object.keys(nameDiffs).length > 0) {
      differences.name = nameDiffs;
    }
  }

  // Compare gender
  if (localPatient.gender !== hiePatient.gender) {
    differences.gender = { local: localPatient.gender, hie: hiePatient.gender };
  }

  // Compare birthdate
  if (localPatient.birthDate !== hiePatient.birthDate) {
    differences.birthDate = { local: localPatient.birthDate, hie: hiePatient.birthDate };
  }

  // Compare identifiers
  const identifierDiffs = {};
  const localIds = localPatient.identifier || [];
  const hieIds = hiePatient.identifier || [];

  localIds.forEach((localId) => {
    const idType = localId.type?.coding?.[0]?.code;
    const hieId = hieIds.find((h) => h.type?.coding?.[0]?.code === idType);

    if (hieId && localId.value !== hieId.value) {
      identifierDiffs[idType] = {
        local: localId.value,
        hie: hieId.value,
      };
    }
  });

  if (Object.keys(identifierDiffs).length > 0) {
    differences.identifiers = identifierDiffs;
  }

  return differences;
}
