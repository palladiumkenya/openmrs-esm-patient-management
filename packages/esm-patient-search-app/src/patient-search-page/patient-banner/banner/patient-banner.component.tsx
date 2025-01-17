import React, { type MouseEvent, useContext, useCallback, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { ButtonSkeleton, SkeletonIcon, SkeletonText, Button, Tag } from '@carbon/react';
import {
  age,
  ExtensionSlot,
  formatDate,
  parseDate,
  PatientBannerContactDetails,
  PatientBannerToggleContactDetailsButton,
  PatientPhoto,
  useConfig,
  usePatient,
  useVisit,
  showModal,
} from '@openmrs/esm-framework';
import { type PatientSearchConfig } from '../../../config-schema';
import { type SearchedPatient } from '../../../types';
import { PatientSearchContext } from '../../../patient-search-context';
import styles from './patient-banner.scss';
import { TwoFactorAuthentication } from '@carbon/react/icons';
import { maskName } from '../../../mpi/utils';
import MpiPatientBanner from '../../../mpi/mpi-patien-banner.component';
interface ClickablePatientContainerProps {
  patientUuid: string;
  children: React.ReactNode;
}

interface PatientBannerProps {
  patient: SearchedPatient;
  patientUuid: string;
  hideActionsOverflow?: boolean;
  isMPIPatient: boolean;
}

const PatientBanner: React.FC<PatientBannerProps> = ({ patient, patientUuid, hideActionsOverflow, isMPIPatient }) => {
  const { t } = useTranslation();
  const { currentVisit } = useVisit(patientUuid);
  const { patient: fhirPatient, isLoading } = usePatient(patientUuid);
  const patientName = patient.person.personName.display;

  const [showContactDetails, setShowContactDetails] = useState(false);
  const toggleContactDetails = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContactDetails((state) => !state);
  }, []);

  const getGender = (gender) => {
    switch (gender) {
      case 'M':
        return t('male', 'Male');
      case 'F':
        return t('female', 'Female');
      case 'O':
        return t('other', 'Other');
      case 'U':
        return t('unknown', 'Unknown');
      default:
        return gender;
    }
  };

  const isDeceased = !!patient.person.deathDate;

  const handleOtpVerification = (patient: SearchedPatient) => {
    const dispose = showModal('otp-authentication-modal', {
      onClose: () => dispose(),
      patient,
    });
  };

  return (
    <>
      <div
        className={classNames(styles.container, {
          [styles.deceasedPatientContainer]: isDeceased,
          [styles.activePatientContainer]: !isDeceased,
        })}
        role="banner">
        <ClickablePatientContainer patientUuid={patientUuid}>
          <div className={styles.patientAvatar} role="img">
            <PatientPhoto patientUuid={patientUuid} patientName={patientName} />
          </div>
          {/* TODO: Replace this section with PatientBannerPatientInfo once the `patient` object is
              changed from SearchedPatient type to fhir.Patient type */}
          <div className={classNames(styles.patientNameRow, styles.patientInfo)}>
            <div className={styles.flexRow}>
              <span className={styles.patientName}>{isMPIPatient ? maskName(patientName) : patientName}</span>
              {isMPIPatient && (
                <div>
                  <Tag className={styles.mpiTag} type="blue">
                    &#127760; {t('hie', 'HIE')}
                  </Tag>
                </div>
              )}
              <ExtensionSlot
                className={styles.flexRow}
                name="patient-banner-tags-slot"
                state={{ patientUuid, patient: fhirPatient }}
              />
            </div>
            <div className={styles.demographics}>
              <span>{getGender(patient.person.gender)}</span>
              {patient.person.birthdate && (
                <>
                  &middot; <span>{age(patient.person.birthdate)}</span> &middot;{' '}
                  <span>{formatDate(parseDate(patient.person.birthdate), { mode: 'wide', time: false })}</span>
                </>
              )}
            </div>
            <div>
              <div className={styles.identifiers}>
                {patient.identifiers?.length ? patient.identifiers.map((i) => i.identifier).join(', ') : '--'}
              </div>
            </div>
          </div>
          <PatientBannerToggleContactDetailsButton
            showContactDetails={showContactDetails}
            toggleContactDetails={toggleContactDetails}
          />
        </ClickablePatientContainer>
        <div className={styles.buttonCol}>
          <div></div>
          {isMPIPatient && (
            <div>
              <Button
                kind="ghost"
                renderIcon={TwoFactorAuthentication}
                iconDescription="Create Patient Record"
                onClick={() => handleOtpVerification(patient)}
                style={{ marginTop: '-0.25rem' }}>
                {t('otpVerification', 'OTP Verification')}
              </Button>
            </div>
          )}
          {!isDeceased && !currentVisit && !isMPIPatient && (
            <ExtensionSlot
              name="start-visit-button-slot"
              state={{
                patientUuid,
              }}
            />
          )}
        </div>
      </div>
      {showContactDetails &&
        (isMPIPatient ? (
          <MpiPatientBanner patient={patient} />
        ) : (
          <PatientBannerContactDetails patientId={patient.uuid} deceased={isDeceased} />
        ))}
    </>
  );
};

const ClickablePatientContainer = ({ patientUuid, children }: ClickablePatientContainerProps) => {
  const { nonNavigationSelectPatientAction, patientClickSideEffect } = useContext(PatientSearchContext);
  const config = useConfig<PatientSearchConfig>();

  if (nonNavigationSelectPatientAction) {
    return (
      <button
        className={classNames(styles.patientBannerButton, styles.patientBanner, {
          [styles.patientAvatarButton]: nonNavigationSelectPatientAction,
        })}
        key={patientUuid}
        onClick={() => {
          nonNavigationSelectPatientAction(patientUuid);
          patientClickSideEffect?.(patientUuid);
        }}>
        {children}
      </button>
    );
  } else {
    return (
      <div className={styles.patientBanner} onClick={() => patientClickSideEffect?.(patientUuid)}>
        {children}
      </div>
    );
  }
};

export const PatientBannerSkeleton = () => {
  return (
    <div className={styles.container} role="banner">
      <div className={styles.patientBanner}>
        <SkeletonIcon className={styles.patientAvatar} />
        <div className={classNames(styles.patientNameRow, styles.patientInfo)}>
          <div className={styles.flexRow}>
            <SkeletonText />
          </div>
          <div className={styles.demographics}>
            <SkeletonIcon />
            &middot;
            <SkeletonIcon />
            &middot;
            <SkeletonIcon />
          </div>
          <div className={styles.identifiers}>
            <SkeletonText />
          </div>
        </div>
      </div>
      <div className={styles.buttonCol}>
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  );
};

export default PatientBanner;
