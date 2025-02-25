import useSWR from 'swr';
const CR = 'https://hiedhs.intellisoftkenya.com/Patient';
const EAST_AFRICA_SHR_BASE_URL = 'https://hiedhs.intellisoftkenya.com/fhir';
// creditials
const USER_NAME = 'kemr';
const PASSWORD = 'password';

const fetcher = (url: string) => {
  return fetch(url, {
    headers: {
      Authorization: `Basic ${btoa(`${USER_NAME}:${PASSWORD}`)}`,
    },
  });
};

export const useCrossBorder = (patientIdentifier: string) => {
  const { data, isLoading, isValidating, mutate } = useSWR(`${CR}/?identifier=12345`, fetcher);
  return { data, isLoading, isValidating, mutate };
};
