import capitalize from 'lodash-es/capitalize';
import { type PatientIdentifierValue, type FormValues } from '../../patient-registration/patient-registration.types';
import { type MapperConfig, type HIEPatient, type ErrorResponse, type HIEPatientResponse } from './hie-types';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { v4 } from 'uuid';
import { z } from 'zod';
import dayjs from 'dayjs';
/**
 * Represents a client for interacting with a Health Information Exchange (HIE) resource.
 * @template T - The type of the resource being fetched.
 */
class HealthInformationExchangeClient<T> {
  async fetchResource(resourceType: string, params: Record<string, string>): Promise<T> {
    const [identifierType, identifierValue] = Object.entries(params)[0];
    const url = `${restBaseUrl}/kenyaemr/getSHAPatient/${identifierValue}/${identifierType}`;
    const response = await openmrsFetch(url);
    return response.json();
  }
}

/**
 * Represents a generic Mapper class.
 * @template T - The source type.
 * @template U - The target type.
 */
class Mapper<T, U> {
  protected config: MapperConfig;

  constructor(config: MapperConfig) {
    this.config = config;
  }
}

/**
 * Maps HIEPatient objects to FormValues objects.
 */
class PatientMapper extends Mapper<HIEPatientResponse, FormValues> {
  mapHIEPatientToFormValues(hiePatient: HIEPatientResponse, currentFormValues: FormValues): FormValues {
    const { familyName, givenName, middleName } = getPatientName(hiePatient);
    const telecom = hiePatient?.entry[0]?.resource.telecom || [];

    const telecomAttributes = this.mapTelecomToAttributes(telecom);
    const updatedIdentifiers = this.mapIdentifiers(hiePatient, currentFormValues);
    const extensionAddressEntries = this.mapExtensionsToAddress(hiePatient?.entry[0]?.resource.extension);
    // TODO: In the event isDead is true, additional information such as caused of death, date e.tc is required
    return {
      isDead: hiePatient?.entry[0]?.resource?.active ? false : true,
      gender: hiePatient?.entry[0]?.resource.gender ?? '',
      birthdate: hiePatient?.entry[0]?.resource?.birthDate ?? '',
      givenName,
      familyName,
      telephoneNumber: telecom.find((t) => t.system === 'phone')?.value || '',
      middleName,
      address: extensionAddressEntries,
      identifiers: updatedIdentifiers,
      attributes: telecomAttributes,
      relationships: [],
      patientUuid: v4(),
    } as FormValues;
  }

  private mapTelecomToAttributes(telecom: Array<fhir.ContactPoint>): Record<string, string> {
    return telecom.reduce<Record<string, string>>((acc, { system, value }) => {
      if (system && value && this.config.teleComMap[system]) {
        const filteredValue = value.replace(/^\+254/, '0');
        if (filteredValue) {
          acc[this.config.teleComMap[system]] = filteredValue;
        }
      }
      return acc;
    }, {});
  }

  private mapIdentifiers(
    hiePatient: HIEPatientResponse,
    currentFormValues: FormValues,
  ): Record<string, PatientIdentifierValue> {
    const updatedIdentifiers: Record<string, PatientIdentifierValue> = { ...currentFormValues.identifiers };
    // Map Social Health Authority Unique Identification Number to HIE Patient ID
    // See https://github.com/palladiumkenya/openmrs-module-kenyaemr/blob/1e1d281eaba8041c45318e60ca0730449b8e4197/api/src/main/distro/metadata/identifierTypes.xml#L33
    updatedIdentifiers.socialHealthAuthorityIdentificationNumber = {
      ...currentFormValues.identifiers['socialHealthAuthorityIdentificationNumber'],
      identifierValue: hiePatient?.entry[0]?.resource?.id,
    };

    // Map fhir.Patient.Identifier to identifiers
    hiePatient.entry[0]?.resource.identifier?.forEach((identifier: fhir.Identifier) => {
      const identifierType = identifier.type?.coding?.[0]?.code;
      const mappedIdentifierType = this.convertToCamelCase(identifierType);
      const identifierValue = identifier.value;

      const existingIdentifier = currentFormValues.identifiers[mappedIdentifierType];
      if (existingIdentifier) {
        updatedIdentifiers[mappedIdentifierType] = {
          ...existingIdentifier,
          identifierValue,
        };
      }
    });

    // Filter out undefined keys and values
    Object.keys(updatedIdentifiers).forEach((key) => {
      if (updatedIdentifiers[key] === undefined || updatedIdentifiers[key].identifierValue === undefined) {
        delete updatedIdentifiers[key];
      }
    });

    return updatedIdentifiers;
  }

  private mapExtensionsToAddress(extensions: HIEPatient['extension']): Record<string, string> {
    return extensions.reduce<Record<string, string>>((acc, ext) => {
      const identifierType = ext.url.split('/').pop();
      const mappedKey = this.config.addressHierarchyMap[identifierType];

      if (mappedKey && ext.valueString) {
        acc[mappedKey] = capitalize(ext.valueString);
      }

      return acc;
    }, {});
  }

  private convertToCamelCase(input: string): string {
    return input
      .split('-')
      .map((word, index) => (index === 0 ? word : capitalize(word)))
      .join('');
  }
}

// Update MapperConfig interface in hie-types.ts

const mapperConfig: MapperConfig = {
  teleComMap: {
    email: 'b8d0b331-1d2d-4a9a-b741-1816f498bdb6',
    phone: 'b2c38640-2603-4629-aebd-3b54f33f1e3a',
  },
  addressHierarchyMap: {
    county: 'countyDistrict',
    'sub-county': 'stateProvince',
    ward: 'address4',
  },
  addressMap: {},
  // Map FHIR Patient identifiers to identifiers, at the moment HIE teams returns null for all identifiers type codings
  identifierMap: {},
};

// Create instances
const hieApiClient = new HealthInformationExchangeClient<HIEPatientResponse | ErrorResponse>();
const patientMapper = new PatientMapper(mapperConfig);

// Exported functions
export const fetchPatientFromHIE = async (
  identifierType: string,
  identifierValue: string,
): Promise<HIEPatientResponse | ErrorResponse> => {
  return hieApiClient.fetchResource('Bundle', { [identifierType]: identifierValue });
};

export const mapHIEPatientToFormValues = (
  hiePatient: HIEPatientResponse,
  currentFormValues: FormValues,
): FormValues => {
  return patientMapper.mapHIEPatientToFormValues(hiePatient, currentFormValues);
};

/**
 * Mask sensitive data by replacing end digits starting from the 2nd to last with '*'
 * @param data {string} - The data to mask
 * @returns {string} - The masked data
 */
export const maskData = (data: string): string => {
  const maskedData = data.slice(0, 2) + '*'.repeat(Math.max(0, data.length - 2));
  return maskedData;
};

/**
 * Get patient name from FHIR Patient resource
 * @param patient {fhir.Patient} - The FHIR Patient resource
 * @returns {object} - The patient name
 */
export const getPatientName = (patient: HIEPatientResponse) => {
  const familyName = patient?.entry?.[0]?.resource?.name?.[0]?.family ?? ''; // Safely access the family name
  const givenNames = patient?.entry?.[0]?.resource?.name?.[0]?.given ?? []; // Safely access the given names array

  const givenName = givenNames?.[0] ?? ''; // The first item is the given name (first name)
  const middleName = givenNames.slice(1).join(' ').trim(); // Combine all other given names as middle name(s)

  return { familyName, givenName, middleName };
};

export const authorizationFormSchema = z.object({
  otp: z.string().min(1, 'Required'),
  receiver: z
    .string()
    .regex(/^(\+?254|0)((7|1)\d{8})$/)
    .optional(),
});

export function generateOTP(length = 5) {
  let otpNumbers = '0123456789';
  let OTP = '';
  const len = otpNumbers.length;
  for (let i = 0; i < length; i++) {
    OTP += otpNumbers[Math.floor(Math.random() * len)];
  }
  return OTP;
}

export function persistOTP(otp: string, patientUuid: string) {
  sessionStorage.setItem(
    patientUuid,
    JSON.stringify({
      otp,
      timestamp: new Date().toISOString(),
    }),
  );
}

export async function sendOtp({ otp, receiver }: z.infer<typeof authorizationFormSchema>, patientName: string) {
  const payload = parseMessage(
    { otp, patient_name: patientName, expiry_time: 5 },
    'Dear {{patient_name}}, your OTP for accessing your Shared Health Records (SHR) is {{otp}}. Please enter this code to proceed. The code is valid for {{expiry_time}} minutes.',
  );

  const url = `${restBaseUrl}/kenyaemr/send-kenyaemr-sms?message=${payload}&phone=${receiver}`;

  const res = await openmrsFetch(url, {
    method: 'POST',
    redirect: 'follow',
  });
  if (res.ok) {
    return await res.json();
  }
  throw new Error('Error sending otp');
}

function parseMessage(object, template) {
  const placeholderRegex = /{{(.*?)}}/g;

  const parsedMessage = template.replace(placeholderRegex, (match, fieldName) => {
    if (object.hasOwnProperty(fieldName)) {
      return object[fieldName];
    } else {
      return match;
    }
  });

  return parsedMessage;
}
export function verifyOtp(otp: string, patientUuid: string) {
  const data = sessionStorage.getItem(patientUuid);
  if (!data) {
    throw new Error('Invalid OTP');
  }
  const { otp: storedOtp, timestamp } = JSON.parse(data);
  const isExpired = dayjs(timestamp).add(5, 'minutes').isBefore(dayjs());
  if (storedOtp !== otp) {
    throw new Error('Invalid OTP');
  }
  if (isExpired) {
    throw new Error('OTP Expired');
  }
  sessionStorage.removeItem(patientUuid);
  return 'Verification success';
}
