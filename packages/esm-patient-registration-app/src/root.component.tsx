import React, { useMemo } from 'react';
import classNames from 'classnames';
import useSWRImmutable from 'swr/immutable';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Grid, Row } from '@carbon/react';
import { ExtensionSlot, useConnectivity, useSession, WorkspaceContainer } from '@openmrs/esm-framework';
import {
  ResourcesContext,
  fetchAddressTemplate,
  fetchAllRelationshipTypes,
  fetchPatientIdentifierTypesWithSources,
} from './offline.resources';
import { FormManager } from './patient-registration/form-manager';
import { PatientRegistration } from './patient-registration/patient-registration.component';
import styles from './root.scss';
import { WorkspaceWrapper } from './util';

export default function Root() {
  const isOnline = useConnectivity();
  const currentSession = useSession();
  const { data: addressTemplate } = useSWRImmutable('patientRegistrationAddressTemplate', fetchAddressTemplate);
  const { data: relationshipTypes } = useSWRImmutable(
    'patientRegistrationRelationshipTypes',
    fetchAllRelationshipTypes,
  );
  const { data: identifierTypes } = useSWRImmutable(
    'patientRegistrationPatientIdentifiers',
    fetchPatientIdentifierTypesWithSources,
  );
  const savePatientForm = useMemo(
    () => (isOnline ? FormManager.savePatientFormOnline : FormManager.savePatientFormOffline),
    [isOnline],
  );

  return (
    <main className={classNames('omrs-main-content', styles.root)}>
      <Grid className={styles.grid}>
        <Row>
          <ExtensionSlot name="breadcrumbs-slot" />
        </Row>
        <ResourcesContext.Provider
          value={{
            addressTemplate,
            relationshipTypes,
            identifierTypes,
            currentSession,
          }}>
          <BrowserRouter basename={window.getOpenmrsSpaBase()}>
            <Routes>
              <Route
                path="patient-registration"
                element={<PatientRegistration savePatientForm={savePatientForm} isOffline={!isOnline} />}
              />
              <Route
                path="patient/:patientUuid/edit"
                element={<PatientRegistration savePatientForm={savePatientForm} isOffline={!isOnline} />}
              />
            </Routes>
            <WorkspaceWrapper />
          </BrowserRouter>
        </ResourcesContext.Provider>
      </Grid>
    </main>
  );
}
