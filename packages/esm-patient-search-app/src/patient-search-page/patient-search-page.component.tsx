import { isDesktop, navigate, useLayoutType } from '@openmrs/esm-framework';
import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PatientSearchContext } from '../patient-search-context';
import PatientSearchOverlay from '../patient-search-overlay/patient-search-overlay.component';
import AdvancedPatientSearchComponent from './advanced-patient-search.component';
import styles from './patient-search-page.scss';
import { inferModeFromSearchParams } from '../mpi/utils';
import { navigateToHie } from '../mpi/otp-authentication.resource';

interface PatientSearchPageComponentProps {}

const PatientSearchPageComponent: React.FC<PatientSearchPageComponentProps> = () => {
  const [searchParams] = useSearchParams();
  const layout = useLayoutType();

  // If a user directly falls on openmrs/spa/search?query= in a tablet view.
  // On clicking the <- on the overlay should take the user on the home page.
  // P.S. The user will never be directed to the patient search page (above URL) in a tablet view otherwise.
  const handleCloseOverlay = useCallback(() => {
    navigate({
      to: window['getOpenmrsSpaBase']() + '/home',
    });
  }, []);

  return isDesktop(layout) ? (
    <div className={styles.patientSearchPage}>
      <div className={styles.patientSearchComponent}>
        <PatientSearchContext.Provider
          value={{
            nonNavigationSelectPatientAction: (patientUuid) => {
              navigateToHie(patientUuid);
            },
          }}>
          <AdvancedPatientSearchComponent
            query={searchParams?.get('query') ?? ''}
            inTabletOrOverlay={!isDesktop(layout)}
            stickyPagination
            searchMode={inferModeFromSearchParams(searchParams)}
          />
        </PatientSearchContext.Provider>
      </div>
    </div>
  ) : (
    <PatientSearchOverlay onClose={handleCloseOverlay} query={searchParams?.get('query') ?? ''} />
  );
};

export default PatientSearchPageComponent;
