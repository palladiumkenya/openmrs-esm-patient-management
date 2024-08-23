import { type FormikProps } from 'formik';
import React, { type Dispatch } from 'react';
import { type FormValues } from '../patient-registration/patient-registration.types';
import { useFeatureFlag } from '@openmrs/esm-framework';
import PatientVerification from './patient-verification/patient-verification.component';
import HIEClientRegistry from './hie-client-registry/hie-client-registry.component';

type ClientRegistryProps = {
  props: FormikProps<FormValues>;
  setInitialFormValues: Dispatch<FormValues>;
};

const ClientRegistry: React.FC<ClientRegistryProps> = (clientRegistryProps) => {
  const healthInformationExchangeFlag = useFeatureFlag('healthInformationExchange');

  if (healthInformationExchangeFlag) {
    return <HIEClientRegistry {...clientRegistryProps} />;
  }
  return <PatientVerification {...clientRegistryProps} />;
};

export default ClientRegistry;
