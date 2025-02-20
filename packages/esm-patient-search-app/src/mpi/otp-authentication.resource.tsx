import {
  restBaseUrl,
  openmrsFetch,
  getSessionLocation,
  type PatientIdentifier,
  type Patient,
  navigate,
  showModal,
  fetchCurrentPatient,
} from '@openmrs/esm-framework';
import { type Identifier, type SearchedPatient } from '../types';
import useSWR from 'swr';
interface OtpPayload {
  otp: string;
  receiver: string;
}

interface OtpContext extends Record<string, string | number> {
  otp: string;
  patient_name: string;
  expiry_time: number;
}

interface OtpResponse {
  success: boolean;
  message: string;
}

export async function sendOtp({ otp, receiver }: OtpPayload, patientName: string): Promise<OtpResponse> {
  validateOtpInputs(otp, receiver, patientName);

  const context: OtpContext = {
    otp,
    patient_name: patientName,
    expiry_time: 5,
  };

  const messageTemplate =
    'Dear {{patient_name}}, your OTP for accessing your Shared Health Records (SHR) is {{otp}}. ' +
    'Please enter this code to proceed. The code is valid for {{expiry_time}} minutes.';

  try {
    const message = parseMessage(context, messageTemplate);
    const url = buildSmsUrl(message, receiver);

    const response = await openmrsFetch(url, {
      method: 'POST',
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to send OTP: ${errorMessage}`);
  }
}

function parseMessage<T extends Record<string, string | number>>(context: T, template: string): string {
  if (!template?.trim()) {
    throw new Error('Template must be a non-empty string');
  }

  const placeholderRegex = /\{\{([^{}]+)\}\}/g;

  return template.replace(placeholderRegex, (match, key: string) => {
    const trimmedKey = key.trim();
    return trimmedKey in context ? String(context[trimmedKey]) : match;
  });
}

function validateOtpInputs(otp: string, receiver: string, patientName: string): void {
  if (!otp?.trim() || !receiver?.trim() || !patientName?.trim()) {
    throw new Error('Missing required parameters: otp, receiver, or patientName');
  }

  if (!receiver.match(/^\+?[1-9]\d{1,14}$/)) {
    throw new Error('Invalid phone number format');
  }
}

function buildSmsUrl(message: string, receiver: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `${restBaseUrl}/kenyaemr/send-kenyaemr-sms?message=${encodedMessage}&phone=${receiver}`;
}

export function generateOTP(length = 5) {
  let otpNumbers = '0123456789';
  let OTP = '';
  const len = otpNumbers.length;
  for (let i = 0; i < length; i++) {
    OTP += otpNumbers[Math.floor(Math.random() * len)];
  }
  return OTP;
}

export async function createPatientPayload(patient: SearchedPatient) {
  const person = patient.person;
  const payload = {
    person: {
      names: [
        {
          preferred: true,
          givenName: person.personName.givenName,
          middleName: person.personName.middleName,
          familyName: person.personName.familyName,
        },
      ],
      gender: patient.person.gender.charAt(0).toUpperCase(),
      birthdate: patient.person.birthdate,
      birthdateEstimated: false,
      attributes: patient.attributes.map((attribute) => ({
        value: attribute.value,
        attributeType: attribute.attributeType.uuid,
      })),
      addresses: patient.person.addresses,
    },
    identifiers: patient.identifiers
      .map((identifier) => ({
        identifier: identifier.identifier,
        identifierType: identifier.identifierType.uuid,
        location: identifier.location.uuid,
        preferred: identifier.preferred,
      }))
      .filter((identifier) => identifier.identifierType !== undefined),
  };

  const openmrsIdentifierSource = 'fb034aac-2353-4940-abe2-7bc94e7c1e71';
  const identifierValue = await generateIdentifier(openmrsIdentifierSource);
  const location = await getSessionLocation();
  const openmrsIdentifier = {
    identifier: identifierValue.data.identifier,
    identifierType: 'dfacd928-0370-4315-99d7-6ec1c9f7ae76',
    location: location.uuid,
    preferred: true,
  };

  payload.identifiers.push(openmrsIdentifier);

  return payload;
}
// create a payload to update the patient, given the local patient and the patient to be created
// if the patient name and gender are the same, do not update the patient
// if the patient name and gender are not the same, update the patient
// also add the SHA Identifier
export async function createPatientUpdatePayload(localPatient: any, patient: SearchedPatient) {
  const updatedPayload: any = {};

  // Check if name or gender needs to be updated
  const localPersonName = localPatient.person.preferredName;
  const searchedPersonName = patient.person.personName;
  const isNameDifferent =
    localPersonName.givenName !== searchedPersonName.givenName ||
    localPersonName.middleName !== searchedPersonName.middleName ||
    localPersonName.familyName !== searchedPersonName.familyName;

  const isGenderDifferent = localPatient.person.gender !== patient.person.gender;

  // Only create update payload if name or gender is different
  if (isNameDifferent || isGenderDifferent) {
    updatedPayload.uuid = localPatient.uuid;
    updatedPayload.person = {
      uuid: localPatient.person.uuid,
      names: [
        {
          preferred: true,
          givenName: patient.person.personName.givenName,
          middleName: patient.person.personName.middleName,
          familyName: patient.person.personName.familyName,
        },
      ],
      gender: patient.person.gender.charAt(0).toUpperCase(),
    };
  }

  // Add SHA identifier if it doesn't exist
  const hasShaIdentifier = localPatient.identifiers.some(
    (identifier: Identifier) => identifier.identifierType.uuid === '24aedd37-b5be-4e08-8311-3721b8d5100d',
  );

  if (!hasShaIdentifier) {
    const shaIdentifier = patient.identifiers.filter(
      (identifier: Identifier) => identifier.identifierType.uuid === '24aedd37-b5be-4e08-8311-3721b8d5100d',
    );
    updatedPayload.identifiers = shaIdentifier.map((identifier: Identifier) => ({
      identifier: identifier.identifier,
      location: identifier.location.uuid,
      identifierType: identifier.identifierType.uuid,
      preferred: false,
    }));
  }

  return updatedPayload;
}

export const searchPatientByNationalId = async (nationalId: string) => {
  const response = await openmrsFetch(`${restBaseUrl}/patient?q=${nationalId}&v=full`);
  const filteredResponse = response.data.results.find((patient: Patient) => {
    return patient.identifiers.some((identifier: PatientIdentifier) => {
      return identifier.identifier === nationalId;
    });
  });
  return filteredResponse;
};

export function generateIdentifier(source: string) {
  const abortController = new AbortController();

  return openmrsFetch(`${restBaseUrl}/idgen/identifiersource/${source}/identifier`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: {},
    signal: abortController.signal,
  });
}

export async function addPatientIdentifier(patientUuid: string, patientIdentifier) {
  const abortController = new AbortController();
  return openmrsFetch(`${restBaseUrl}/patient/${patientUuid}/identifier/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController.signal,
    body: patientIdentifier,
  });
}

// Helper function to check if the patient has the following either
// 1. National ID
// 2. Birth Certificate Number
// 3. Passport Number
// If the patient has either of the above, check if the patient has a SHA identifier
// If the patient has a SHA identifier, That mean the patient has already been registered in the HIE, navigate to patient search
// If the patient does not have a SHA identifier, navigate to the HIE advanced search page
export async function navigateToHie(patientUuid: string) {
  const fetchedPatient: fhir.Patient = await fetchCurrentPatient(patientUuid);

  const identifierTypes = [
    { identifierType: 'National ID', identifierTypeUuid: '49af6cdc-7968-4abb-bf46-de10d7f4859f' }, // National ID
    { identifierType: 'Birth Certificate Number', identifierTypeUuid: '68449e5a-8829-44dd-bfef-c9c8cf2cb9b2' }, // Birth Certificate Number
    { identifierType: 'Passport Number', identifierTypeUuid: 'be9beef6-aacc-4e1f-ac4e-5babeaa1e303' }, // Passport Number
  ];

  const requiredIdentifier = fetchedPatient.identifier.find((identifier: fhir.Identifier) =>
    identifierTypes.some((type) => type.identifierTypeUuid === identifier.type?.coding?.[0]?.code),
  );

  if (!requiredIdentifier) {
    // navigate to patient registration page to update the patient with the required identifiers
    navigate({ to: `${window['getOpenmrsSpaBase']()}patient/${patientUuid}/edit` });
    return;
  }

  const hasShaIdentifier = fetchedPatient.identifier.some(
    (identifier: fhir.Identifier) => identifier.type?.coding?.[0]?.code === '24aedd37-b5be-4e08-8311-3721b8d5100d',
  );
  if (hasShaIdentifier) {
    navigate({ to: `${window['getOpenmrsSpaBase']()}patient/${patientUuid}/chart` });
  } else {
    // show the HIE sync modal
    const dispose = showModal('hie-syc-modal', {
      patientUuid: patientUuid,
      localPatient: fetchedPatient,
      identifier: requiredIdentifier,
      onClose: () => dispose(),
    });
  }
}

export function useHIEPatient(searchQuery: string, identifierType: string) {
  const url = `${restBaseUrl}/kenyaemr/getSHAPatient/${searchQuery}/${identifierType}`;
  const { data, isLoading, error } = useSWR<{ data: fhir.Bundle }>(url, openmrsFetch);

  const fhirPatient = data?.data?.entry?.map((entry: fhir.BundleEntry) => entry?.resource as fhir.Patient)?.[0];

  return { data: fhirPatient, isLoading, error };
}

export function createPatientUpdatePayloadFromFhir(
  localPatient: fhir.Patient,
  patient: fhir.Patient,
  locationUuid: string,
) {
  const updatedPayload: any = {};

  // Extract names
  const localName = localPatient.name?.[0] || {};
  const searchedName = patient.name?.[0] || {};

  const isNameDifferent =
    localName.given?.[0] !== searchedName.given?.[0] ||
    localName.given?.[1] !== searchedName.given?.[1] ||
    localName.family !== searchedName.family;

  const isGenderDifferent = localPatient.gender !== patient.gender;

  if (isNameDifferent || isGenderDifferent) {
    updatedPayload.uuid = localPatient.id;
    updatedPayload.person = {
      uuid: localPatient.id,
      names: [
        {
          preferred: true,
          givenName: searchedName.given?.[0] || '',
          middleName: searchedName.given?.[1] || '',
          familyName: searchedName.family || '',
        },
      ],
      gender: (patient.gender || '').charAt(0).toUpperCase(),
    };
  }

  // extract the sha identifier from the patient
  const shaIdentifier = patient.identifier?.find((identifier) => {
    return identifier?.type?.coding?.some((code) => code.code === 'sha-number');
  });

  if (shaIdentifier) {
    updatedPayload.identifiers = [
      {
        identifier: shaIdentifier.value,
        location: locationUuid,
        identifierType: '24aedd37-b5be-4e08-8311-3721b8d5100d',
        preferred: false,
      },
    ];
  }

  return updatedPayload;
}
