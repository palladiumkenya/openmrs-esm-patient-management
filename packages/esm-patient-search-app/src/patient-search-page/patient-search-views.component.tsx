import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Layer, Tile, Button, Select, SelectItem } from '@carbon/react';
import EmptyDataIllustration from '../ui-components/empty-data-illustration.component';
import PatientBanner, { PatientBannerSkeleton } from './patient-banner/banner/patient-banner.component';
import { type SearchedPatient } from '../types';
import styles from './patient-search-lg.scss';
import { navigate, useFeatureFlag } from '@openmrs/esm-framework';

interface CommonProps {
  inTabletOrOverlay: boolean;
  searchMode?: 'mpi' | null | undefined;
  searchTerm: string;
}

interface PatientSearchResultsProps {
  searchResults: SearchedPatient[];
  searchTerm: string;
  searchMode?: 'mpi' | null | undefined;
}

export const EmptyState: React.FC<CommonProps> = ({ inTabletOrOverlay }) => {
  const { t } = useTranslation();
  return (
    <Layer>
      <Tile
        className={classNames(styles.emptySearchResultsTile, {
          [styles.paddedEmptySearchResultsTile]: inTabletOrOverlay,
        })}>
        <EmptyDataIllustration />
        <p className={styles.emptyResultText}>
          {t('noPatientChartsFoundMessage', 'Sorry, no patient charts were found')}
        </p>
        <p className={styles.actionText}>
          <span>{t('trySearchWithPatientUniqueID', "Try to search again using the patient's unique ID number")}</span>
        </p>
      </Tile>
    </Layer>
  );
};

export const LoadingState: React.FC<CommonProps> = ({ inTabletOrOverlay }) => {
  return (
    <div
      className={classNames(styles.results, {
        [styles.paddedEmptySearchResultsTile]: inTabletOrOverlay,
      })}>
      <PatientBannerSkeleton />
      <PatientBannerSkeleton />
      <PatientBannerSkeleton />
      <PatientBannerSkeleton />
      <PatientBannerSkeleton />
    </div>
  );
};

export const ErrorState: React.FC<CommonProps> = ({ inTabletOrOverlay }) => {
  const { t } = useTranslation();
  return (
    <Layer>
      <Tile
        className={classNames(styles.emptySearchResultsTile, {
          [styles.paddedEmptySearchResultsTile]: inTabletOrOverlay,
        })}>
        <EmptyDataIllustration />
        <div>
          <p className={styles.errorMessage}>{`${t('error', 'Error')}`}</p>
          <p className={styles.errorCopy}>
            {t(
              'errorCopy',
              'Sorry, there was an error. You can try to reload this page, or contact the site administrator and quote the error code above.',
            )}
          </p>
        </div>
      </Tile>
    </Layer>
  );
};

export const SearchResultsEmptyState: React.FC<CommonProps> = ({ inTabletOrOverlay, searchMode, searchTerm }) => {
  const { t } = useTranslation();
  const isMPIEnabled = useFeatureFlag('mpiFlag');
  const isSearchPage = window.location.pathname === '/openmrs/spa/search';

  const identifierTypes = [
    { identifierType: 'Select an identifier type', identifierValue: 'select-identifier-type' },
    { identifierType: 'National ID', identifierValue: 'National ID' },
    { identifierType: 'Passport Number', identifierValue: 'passport-number' },
    { identifierType: 'Birth Certificate Number', identifierValue: 'birth-certificate-number' },
    { identifierType: 'Alien ID Number', identifierValue: 'alien-id-number' },
    { identifierType: 'Refugee ID Number', identifierValue: 'refugee-number' },
  ];
  return (
    <Layer>
      <Tile
        className={classNames(styles.emptySearchResultsTile, {
          [styles.paddedEmptySearchResultsTile]: inTabletOrOverlay,
        })}>
        <EmptyDataIllustration />
        <p className={styles.emptyResultText}>
          {t('noPatientChartsFoundMessage', 'Sorry, no patient charts were found')}
        </p>
        {isMPIEnabled && isSearchPage ? (
          <>
            <div className={styles.dividerWrapper}>
              <div className={styles.divider}></div>
            </div>
            {(searchMode === undefined || searchMode === null || searchMode !== 'mpi') && (
              <>
                <div className={styles.emptyResultsMarginRules}>
                  <p>
                    {t(
                      'trySearchFromClientRegistry',
                      "Try searching using the patient's unique ID number or search the HIE Registry",
                    )}
                  </p>
                </div>
                <div className={styles.identifierTypeSelect}>
                  <Select
                    light
                    id={`identifier-type`}
                    hideLabel
                    helperText={t(
                      'selectIdentifierTypeHelperText',
                      'Select an identifier type to perform HIE Registry search',
                    )}
                    onChange={(e) => {
                      const identifierType = e.target.value;
                      if (identifierType === 'select-identifier-type') {
                        return;
                      }
                      doMPISearch(searchTerm, identifierType);
                    }}
                    defaultValue="option-3">
                    {identifierTypes.map((identifierType) => (
                      <SelectItem value={identifierType.identifierValue} text={identifierType.identifierType} />
                    ))}
                  </Select>
                </div>
              </>
            )}
          </>
        ) : (
          <p className={styles.actionText}>
            <span>{t('trySearchWithPatientUniqueID', "Try to search again using the patient's unique ID number")}</span>
          </p>
        )}
      </Tile>
    </Layer>
  );
};

export const PatientSearchResults: React.FC<PatientSearchResultsProps> = ({ searchResults, searchMode }) => {
  return (
    <div className={styles.results} data-openmrs-role="Search Results">
      {searchResults.map((patient, indx) => (
        <PatientBanner key={indx} patientUuid={patient.uuid} patient={patient} isMPIPatient={searchMode == 'mpi'} />
      ))}
    </div>
  );
};

function doMPISearch(searchTerm: string, identifierType?: string) {
  navigate({
    to: '${openmrsSpaBase}/search?query=${searchTerm}&mode=mpi&identifierType=${identifierType}',
    templateParams: { searchTerm: searchTerm, identifierType: identifierType },
  });
}
