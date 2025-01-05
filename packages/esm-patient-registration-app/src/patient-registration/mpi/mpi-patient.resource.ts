import useSWR from 'swr';

const fetcher = (url: string) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Authorization', `Basic ${btoa('kemr:password')}`);
  return fetch(url, { headers }).then((res) => res.json());
};

export function useMpiPatient(patientId: string) {
  const url = `https://hiedhs.intellisoftkenya.com/fhir/Patient?_id=${patientId}`;

  const { data: patient, error: error, isLoading: isLoading } = useSWR<{ data: fhir.Bundle }, Error>(url, fetcher);
  const patientInfo = patient?.['entry']?.[0]?.resource;

  return {
    isLoading,
    patient: patientInfo,
    error,
  };
}
