import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { Appointment, AppointmentService, Provider } from '../types';
import { useAppointmentDate } from '../helpers';
import { string } from 'yup';

interface AppointmentPatientList {
  uuid: string;
  appointmentNumber: number;
  patient: {
    phoneNumber: string;
    gender: string;
    dob: number;
    name: string;
    uuid: string;
    age: number;
    identifier: string;
  };
  provider: Provider;
  service: AppointmentService;
  startDateTime: string;
}

const useAppointmentList = (appointmentStatus: string) => {
  const forDate = useAppointmentDate();
  const url = `/ws/rest/v1/appointment/appointmentStatus?status=${appointmentStatus}&forDate=${forDate}`;
  const { data, error } = useSWR<{ data: Array<AppointmentPatientList> }>(url, openmrsFetch);
  const appointments = data?.data.map((appointment) => ({
    name: appointment.patient.name,
    patientUuid: appointment.patient.uuid,
    identifier: appointment.patient?.identifier,
    dateTime: appointment.startDateTime,
    serviceType: appointment.service?.name,
    provider: appointment?.provider?.display ?? '',
  }));
  return { appointmentList: (appointments as Array<any>) ?? [], isLoading: !data && !error, error };
};

export default useAppointmentList;
