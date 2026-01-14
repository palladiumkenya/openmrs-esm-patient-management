import { openmrsFetch, restBaseUrl, useSession, type FetchResponse } from '@openmrs/esm-framework';
import { type Consent, type SHAFacility } from './types';
import useSWR from 'swr';

export const sendOtp = async (consent: Partial<Consent>) => {
  const url = `${restBaseUrl}/kenyaemr/consent-request`;
  const response = await openmrsFetch(url, {
    method: 'POST',
    body: JSON.stringify(consent),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const validateOtp = async (otp: Consent) => {
  const url = `${restBaseUrl}/kenyaemr/validate-otp`;
  const response = await openmrsFetch(url, {
    method: 'POST',
    body: JSON.stringify(otp),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export function useShaFacilityInfo(shouldSynchronize: boolean = true) {
  const { authenticated } = useSession();
  const url = `${restBaseUrl}/kenyaemr/sha-facility-status?synchronize=${shouldSynchronize}`;

  const { data, isLoading, error, mutate } = useSWR<FetchResponse<SHAFacility>>(
    authenticated ? url : null,
    openmrsFetch,
  );

  return {
    isLoading,
    shaFacility: data?.data,
    error,
    mutate,
  };
}
