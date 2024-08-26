import { add, capitalize } from 'lodash-es';
import { type PatientIdentifierValue, type FormValues } from '../../patient-registration/patient-registration.types';
import { type MapperConfig, type HIEPatient, type ErrorResponse } from './hie-types';
import { getConfig } from '@openmrs/esm-framework';
import { type RegistrationConfig } from '../../config-schema';
import { v4 } from 'uuid';
/**
 * Represents a client for interacting with a Health Information Exchange (HIE) resource.
 * @template T - The type of the resource being fetched.
 */
class HealthInformationExchangeClient<T> {
  async fetchResource(resourceType: string, params: Record<string, string>): Promise<T> {
    const {
      hieClientRegistry: { baseUrl, encodedCredentials },
    } = await getConfig<RegistrationConfig>('@kenyaemr/esm-patient-registration-app');
    const urlParams = new URLSearchParams(params);
    const response = await fetch(`${baseUrl}${resourceType}?${urlParams}`, {
      headers: new Headers({
        Authorization: `Basic ${encodedCredentials}`,
      }),
    });

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
class PatientMapper extends Mapper<HIEPatient, FormValues> {
  mapHIEPatientToFormValues(hiePatient: HIEPatient, currentFormValues: FormValues): FormValues {
    const name = hiePatient.name?.[0] || {};
    const telecom = hiePatient.telecom || [];

    const telecomAttributes = this.mapTelecomToAttributes(telecom);
    const updatedIdentifiers = this.mapIdentifiers(hiePatient, currentFormValues);
    const extensionAddressEntries = this.mapExtensionsToAddress(hiePatient.extension);

    return {
      isDead: hiePatient.deceasedBoolean || false,
      gender: hiePatient.gender || '',
      birthdate: hiePatient.birthDate || '',
      givenName: name.given?.[0] || '',
      familyName: name.family || '',
      telephoneNumber: telecom.find((t) => t.system === 'phone')?.value || '',
      middleName: name.given?.[1],
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
        const filteredValue = value.replace(/^254/, '0');
        if (filteredValue) {
          acc[this.config.teleComMap[system]] = filteredValue;
        }
      }
      return acc;
    }, {});
  }

  private mapIdentifiers(
    hiePatient: HIEPatient,
    currentFormValues: FormValues,
  ): Record<string, PatientIdentifierValue> {
    const updatedIdentifiers: Record<string, PatientIdentifierValue> = { ...currentFormValues.identifiers };

    // Map healthId to hiePatient.id
    updatedIdentifiers.healthId = {
      ...currentFormValues.identifiers['healthId'],
      identifierValue: hiePatient.id,
    };

    // Map fhir.Patient.Identifier to identifiers
    hiePatient.identifier?.forEach((identifier) => {
      const system = identifier.system?.split('/').pop();
      if (system && this.config.identifierMap[system]) {
        const key = this.config.identifierMap[system];
        updatedIdentifiers[key] = {
          ...currentFormValues.identifiers[key],
          identifierValue: identifier.value || '',
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

export const mapHIEPatientToFormValues = (hiePatient: HIEPatient, currentFormValues: FormValues): FormValues => {
  return patientMapper.mapHIEPatientToFormValues(hiePatient, currentFormValues);
};
