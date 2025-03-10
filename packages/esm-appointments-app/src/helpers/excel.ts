import * as XLSX from 'xlsx';
import { fetchCurrentPatient, formatDate, getConfig, openmrsFetch, type Patient, restBaseUrl } from '@openmrs/esm-framework';
import { type Appointment } from '../types';
import { type ConfigObject } from '../config-schema';
import { moduleName } from '../constants';

/**
 * Exports the provided appointments as an Excel spreadsheet.
 * @param {Array<Appointment>} appointments - The list of appointments to export.
 * @param {string} [fileName] - The name of the downloaded file
 */
export async function exportAppointmentsToSpreadsheet(appointments: Array<Appointment>, fileName = 'Appointments') {
  const config = await getConfig<ConfigObject>(moduleName);
  const includePhoneNumbers = config.includePhoneNumberInExcelSpreadsheet ?? false;

  const appointmentsJSON = await Promise.all(
    appointments.map(async (appointment: Appointment) => {
      const patientInfo = await fetchCurrentPatient(appointment.patient.uuid);

      const phoneNumberFromPatientAttributes = await getPhoneNumber(appointment.patient.uuid);
      const phoneNumber =
        includePhoneNumbers && patientInfo?.telecom
          ? patientInfo.telecom.map((telecomObj) => telecomObj?.value).join(', ')
          : phoneNumberFromPatientAttributes;

      return {
        'Patient name': appointment.patient.name,
        Gender: appointment.patient.gender === 'F' ? 'Female' : 'Male',
        Age: appointment.patient.age,
        Identifier: extractIdentifier(patientInfo) ?? appointment.patient.identifier ?? '--',
        'Appointment type': appointment.service?.name,
        Date: formatDate(new Date(appointment.startDateTime), { mode: 'wide' }),
        ...(includePhoneNumbers ? { 'Telephone number': phoneNumber } : {}),
      };
    }),
  );

  const worksheet = createWorksheet(appointmentsJSON);
  const workbook = createWorkbook(worksheet, 'Appointment list');
  XLSX.writeFile(workbook, `${fileName}.xlsx`, { compression: true });
}

/**
Exports unscheduled appointments as an Excel spreadsheet.
@param {Array<Object>} unscheduledAppointments - The list of unscheduled appointments to export.
@param {string} fileName - The name of the file to download. Defaults to 'Unscheduled appointments {current date and time}'.
*/
export function exportUnscheduledAppointmentsToSpreadsheet(
  unscheduledAppointments: Array<any>,
  fileName = `Unscheduled appointments ${formatDate(new Date(), { year: true, time: true })}`,
) {
  const appointmentsJSON = unscheduledAppointments?.map((appointment) => ({
    'Patient name': appointment.name,
    Gender: appointment.gender === 'F' ? 'Female' : 'Male',
    Age: appointment.age,
    'Phone Number': appointment.phoneNumber ?? '--',
    Identifier: extractIdentifier(appointment) ?? appointment.identifier,
  }));

  const worksheet = createWorksheet(appointmentsJSON);
  const workbook = createWorkbook(worksheet, 'Appointment list');

  XLSX.writeFile(workbook, `${fileName}.xlsx`, {
    compression: true,
  });
}

function createWorksheet(data: any[]) {
  const max_width = data.reduce((w, r) => Math.max(w, r['Patient name'].length), 30);
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [{ wch: max_width }];
  return worksheet;
}

function createWorkbook(worksheet: XLSX.WorkSheet, sheetName: string) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}

const customRepresentation =
  'custom:(uuid,display,identifiers:(identifier,uuid,preferred,location:(uuid,name),identifierType:(uuid,name,format,formatDescription,validator)),person:(uuid,display,gender,birthdate,dead,age,deathDate,birthdateEstimated,causeOfDeath,preferredName:(uuid,preferred,givenName,middleName,familyName),attributes,preferredAddress:(uuid,preferred,address1,address2,cityVillage,longitude,stateProvince,latitude,country,postalCode,countyDistrict,address3,address4,address5,address6,address7)))';

// This is a temporary fix to get the phone number from the patient attributes.
export const getPhoneNumber = async (patientUuid: string) => {
  const response = await openmrsFetch<Patient>(`${restBaseUrl}/patient/${patientUuid}?v=${customRepresentation}`);
  const phoneNumberPersonAttributeTypeUuid = 'b2c38640-2603-4629-aebd-3b54f33f1e3a';
  return (
    response?.data?.person?.attributes?.find(
      (attribute) => attribute.attributeType.uuid === phoneNumberPersonAttributeTypeUuid,
    )?.value ?? '--'
  );
};

export const extractIdentifier = (patientInfo: fhir.Patient) => {
  const patientClinicNumberIdentifierTypeUuid = 'b4d66522-11fc-45c7-83e3-39a1af21ae0d';
  const identifiers = patientInfo?.identifier;
  const clinicNumberIdentifier = identifiers?.find((identifier) =>
    identifier?.type?.coding.find((coding) => coding?.code === patientClinicNumberIdentifierTypeUuid),
  );
  return clinicNumberIdentifier?.value ?? '';
};
