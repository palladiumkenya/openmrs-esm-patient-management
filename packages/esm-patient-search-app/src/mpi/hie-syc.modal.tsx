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
import { ModalHeader, ModalBody, ModalFooter, Button, InlineLoading, InlineNotification, Modal } from '@carbon/react';
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

  const handleSyncAndContinueToChart = async () => {
    onClose();

    if (!hiePatient) {
      navigate({ to: `${window['getOpenmrsSpaBase']()}patient/${localPatient.id}/chart` });
    }

    const payload = createPatientUpdatePayloadFromFhir(localPatient, hiePatient, session?.sessionLocation?.uuid);
    const patientRegistrationUrl = `${restBaseUrl}/patient/${localPatient.id}`;
    const registeredPatient = await openmrsFetch(patientRegistrationUrl, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (registeredPatient?.data?.uuid) {
      await addPatientIdentifier(localPatient.id, JSON.stringify(payload?.identifiers[0]));
      showSnackbar({
        title: t('patientUpdated', 'Patient Updated'),
        subtitle: t('patientUpdatedSubtitle', 'Patient has been successfully updated'),
        kind: 'success',
      });
      navigate({ to: `${window['getOpenmrsSpaBase']()}patient/${localPatient.id}/chart` });
    }
  };

  const syncButtonText = hiePatient
    ? t('syncAndContinueToChart', 'Sync and Continue to Chart')
    : t('continueToChart', 'Continue to Chart');

  return (
    <div>
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
        {differences && (
          <InlineNotification
            kind="warning-alt"
            lowContrast
            title={t('differencesFound', 'Differences found')}
            subtitle={t(
              'differencesFoundSubtitle',
              `The patient information in our system differs from the HIE record. Please review these differences before proceeding with the sync operation.`,
            )}
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={handleClose}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button disabled={isLoading} kind="primary" onClick={handleSyncAndContinueToChart}>
          {syncButtonText}
        </Button>
      </ModalFooter>
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

  // Compare name
  const localName = localPatient.name?.[0]?.text;
  const hieName = hiePatient.name?.[0]?.text;
  if (localName !== hieName) {
    differences.name = { local: localName, hie: hieName };
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
