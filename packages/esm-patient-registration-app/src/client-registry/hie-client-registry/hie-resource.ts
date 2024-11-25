import capitalize from 'lodash-es/capitalize';
import { type PatientIdentifierValue, type FormValues } from '../../patient-registration/patient-registration.types';
import { type MapperConfig, type HIEPatient, type ErrorResponse, type HIEPatientResponse } from './hie-types';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { v4 } from 'uuid';
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

    return {
      isDead: hiePatient?.entry[0]?.resource?.active || false,
      gender: hiePatient?.entry[0]?.resource.gender || '',
      birthdate: hiePatient?.entry[0]?.resource?.birthDate || '',
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
const hieApiClient = new HealthInformationExchangeClient<HIEPatient | ErrorResponse>();
const patientMapper = new PatientMapper(mapperConfig);

// Exported functions
export const fetchPatientFromHIE = async (
  identifierType: string,
  identifierValue: string,
): Promise<HIEPatient | ErrorResponse> => {
  return hieApiClient.fetchResource('Patient', { [identifierType]: identifierValue });
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
