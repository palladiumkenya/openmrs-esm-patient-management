import { restBaseUrl, openmrsFetch, getSessionLocation } from '@openmrs/esm-framework';
import { type SearchedPatient } from '../types';

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

export async function createPatient(patient: SearchedPatient) {
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
