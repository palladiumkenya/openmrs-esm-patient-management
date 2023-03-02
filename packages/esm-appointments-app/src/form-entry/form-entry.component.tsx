import { ExtensionSlot, usePatient } from '@openmrs/esm-framework';
import React, { useMemo } from 'react';
import { closeOverlay } from '../hooks/useOverlay';

interface FormEntryProps {
  patientUuid: string;
}

const FormEntry: React.FC<FormEntryProps> = ({ patientUuid }) => {
  const { isLoading, patient } = usePatient(patientUuid);

  const state = useMemo(
    () => ({
      view: 'form',
      formUuid: 'a1a62d1e-2def-11e9-b210-d663bd873d93',
      visitUuid: '',
      visitTypeUuid: '',
      patientUuid: patientUuid ?? null,
      patient,
      encounterUuid: '',
      closeWorkspace: closeOverlay,
    }),
    [patientUuid, patient],
  );

  return <div>{patient && <ExtensionSlot extensionSlotName="form-widget-slot" state={state} />}</div>;
};

export default FormEntry;
