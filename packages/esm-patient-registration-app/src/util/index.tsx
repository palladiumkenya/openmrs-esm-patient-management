import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { WorkspaceContainer } from '@openmrs/esm-framework';

export const WorkspaceWrapper = () => {
  const location = useLocation();
  const contextKey = useMemo(() => {
    const path = location.pathname.replace(/^\/|\/$/g, '');
    return path || 'patient-registration';
  }, [location.pathname]);
  return <WorkspaceContainer key={contextKey} contextKey={contextKey} overlay />;
};
