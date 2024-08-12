import { type OpenmrsResource, openmrsFetch, restBaseUrl, showModal, showSnackbar } from '@openmrs/esm-framework';
import { type FormValues } from '../../../patient-registration.types';
import useSWRImmutable from 'swr/immutable';
import { util } from 'zod';
import jsonStringifyReplacer = util.jsonStringifyReplacer;

export type HiePayload = {
  firstName: string;
  identificationNumber: string;
  identificationType: any;
};

type HieClientRegistryResponse = fhir.Patient & {
  resourceType: string;
  issue?: Array<{ code: string; diagnostics: string; severity: string }>;
};

const fetcher = (url: string) =>
  openmrsFetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic RHJ0eXR5dDZ0eWZoNmpoZ2o4dTR5Nnk6RlRHSFQmSk5IZnRkZXJ3dGVyNGQ2MzI=',
    },
  }).then((res) => res.json());

export const searchHieClientRegistry = (hiePayload: HiePayload, url): Promise<HieClientRegistryResponse> => {
  let id_type = hiePayload?.identificationType?.uuid;
  let param_val = '';
  if (id_type == 1) {
    param_val = 'national-id';
  } else if (id_type == 2) {
    param_val = 'passport';
  } else if (id_type == 3) {
    param_val = 'birth-certificate-number';
  } else if (id_type == 4) {
    param_val = 'alien-id';
  } else if (id_type == 5) {
    param_val = 'refugee-id';
  }

  return fetcher(url + '?' + param_val + '=' + hiePayload.identificationNumber);
};

export const useIdenfierTypes = () => {
  const { isLoading, data, error } = useSWRImmutable<{ data: { results: Array<OpenmrsResource> } }>(
    `${restBaseUrl}/patientidentifiertype`,
    openmrsFetch,
  );

  return {
    patientIdentifierTypes: data?.data.results ?? [],
    isLoading,
    error,
  };
};

export const handleSearchSuccess = (fhirPatient: HieClientRegistryResponse, updateRegistrationInitialValues, t) => {
  if (fhirPatient.resourceType !== 'Patient') {
    showSnackbar({
      kind: 'error',
      title: t('searchFailed', 'Search failed'),
      timeoutInMs: 5000,
      isLowContrast: true,
      subtitle: fhirPatient.issue?.[0]?.diagnostics ?? t('noPatientFound', 'No patient found'),
    });
    return;
  }
  // TODO: handle mapping of FHIR Patient Identifer to OpenMRS Patient Identifier

  // TODO: handle empty state of FHIR Patient

  const openmrsPatient: Partial<FormValues> = {
    givenName: fhirPatient.name[0].given[0],
    familyName: fhirPatient.name[0].family,
    birthdate: fhirPatient.birthDate,
    gender: fhirPatient.gender,
  };
  const dispose = showModal('hei-confirmation-modal', {
    patient: fhirPatient,
    close: () => dispose(),
    onConfirm: () => {
      updateRegistrationInitialValues((prevState: FormValues) => ({ ...prevState, ...openmrsPatient }));
      dispose();
    },
  });
};

export const handleSearchError = (error: any, t) => {
  showSnackbar({
    kind: 'error',
    title: t('searchFailed', 'Search failed'),
    timeoutInMs: 5000,
    subtitle: error?.message ?? '',
  });
};
