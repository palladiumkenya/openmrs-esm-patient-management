import { type Identifier, type SearchedPatient } from '../types';
import { getCoreTranslation, openmrsFetch, restBaseUrl, type Session } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
export function inferModeFromSearchParams(searchParams: URLSearchParams): 'mpi' | null {
  return searchParams.get('mode')?.toLowerCase() === 'mpi' ? 'mpi' : null;
}

export function mapToOpenMRSPatient(
  fhirPatients: fhir.Bundle,
  nameTemplate: string,
  session: Session,
): Array<SearchedPatient> {
  if (!fhirPatients) {
    return [];
  }

  if (fhirPatients.total < 1) {
    return [];
  }
  //Consider patient // https://github.com/openmrs/openmrs-esm-core/blob/main/packages/framework/esm-api/src/types/patient-resource.ts

  const pts: Array<SearchedPatient> = fhirPatients?.entry?.map((pt, index) => {
    let fhirPatient = pt.resource as fhir.Patient;

    return {
      externalId: fhirPatient.id,
      uuid: null,
      identifiers: mapToOpenMRSIdentifier(fhirPatient, session),
      person: {
        addresses: fhirPatient?.address?.map((address) => ({
          cityVillage: address.city,
          stateProvince: address.state,
          country: address.country,
          postalCode: address.postalCode,
          preferred: false,
          address1: address?.line && address.line.length > 0 ? address.line[0] : undefined,
          voided: false,
        })),
        age: null,
        birthdate: fhirPatient.birthDate,
        gender: getCoreTranslation(fhirPatient.gender as 'female' | 'male' | 'other' | 'unknown'),
        dead: checkDeceased(fhirPatient),
        deathDate: fhirPatient.deceasedDateTime,
        personName: {
          display: formatName(fhirPatient, nameTemplate),
          givenName: fhirPatient.name[0]?.given[0],
          familyName: fhirPatient.name[0]?.family,
          middleName: fhirPatient.name[0]?.given[1],
        },
      },
      attributes: fhirPatient.telecom?.map((telecom) => ({
        value: telecom.value,
        attributeType: {
          uuid: mapFhirTelecomToOpenmrsPersonAttributeType(telecom),
          display: telecom.system,
        },
      })),
      contact: fhirPatient?.contact as Array<fhir.Patient>,
    };
  });

  return pts;
}

const personAttributeTypes = await getPersonAttributeTypes();

const mapFhirTelecomToOpenmrsPersonAttributeType = (telecom: fhir.ContactPoint) => {
  const attributeType = personAttributeTypes.find((type) => {
    if (telecom.system === 'phone') {
      return 'phone' in type;
    } else if (telecom.system === 'email') {
      return 'email' in type;
    }
    return false;
  });

  if (attributeType) {
    return telecom.system === 'phone' ? attributeType.phone : attributeType.email;
  }
  return null;
};

const fhirToOpenmrsIdentifierCodeMap = {
  'sha-number': '24aedd37-b5be-4e08-8311-3721b8d5100d',
  'national-id': '49af6cdc-7968-4abb-bf46-de10d7f4859f',
  'passport-number': 'be9beef6-aacc-4e1f-ac4e-5babeaa1e303',
  'birth-certificate-number': '68449e5a-8829-44dd-bfef-c9c8cf2cb9b2',
};

function mapToOpenMRSIdentifier(fhirPatient: fhir.Patient, session: Session): Array<Identifier> {
  const sessionLocation = session.sessionLocation;
  const identifiers = fhirPatient?.identifier ?? [];
  const openmrsIdentifiers: Array<Identifier> = identifiers.map((identifier) => ({
    display: identifier.value,
    identifier: identifier.value,
    identifierType: {
      uuid: fhirToOpenmrsIdentifierCodeMap[identifier.type.coding[0].code],
      display: identifier.type.coding[0].display,
    },
    location: { uuid: sessionLocation.uuid, display: sessionLocation.display },
    preferred: false,
    uuid: identifier.id,
  }));

  return openmrsIdentifiers;
}

export function checkDeceased(fhirPatient: fhir.Patient): boolean | null {
  if (fhirPatient.deceasedBoolean) {
    return true;
  }

  if (fhirPatient.deceasedDateTime) {
    const deceasedDate = dayjs(fhirPatient.deceasedDateTime);
    const currentDate = dayjs();

    if (deceasedDate.isBefore(currentDate) || deceasedDate.isSame(currentDate, 'day')) {
      return true;
    }
  }

  return null;
}

function formatNamex(fhirPatient: fhir.Patient, template: string) {
  const name = fhirPatient.name[0];

  const givenName = name.given ? name.given[0] : '';
  const familyName = name.family || '';
  const fullName = name.text || `${givenName} ${familyName}`;

  const formattedName = template
    .replace('{given}', givenName)
    .replace('{family}', familyName)
    .replace('{fullName}', fullName);

  return formattedName;
}

function formatName(fhirPatient: fhir.Patient, template: string): string {
  if (!fhirPatient?.name || fhirPatient.name.length === 0) {
    return '';
  }

  const name = fhirPatient.name[0];

  const givenName = name.given?.[0] ?? '';
  const familyName = name.family ?? '';
  const fullName = name.text ?? `${givenName} ${familyName}`.trim();

  return template.replace('{given}', givenName).replace('{family}', familyName).replace('{fullName}', fullName).trim();
}

export function maskName(fullName) {
  // Split the name into parts
  const nameParts = fullName.trim().split(' ');

  // Process each part of the name
  const maskedParts = nameParts.map((part) => {
    if (part.length <= 2) return part; // Don't mask if 2 or fewer characters

    // Keep first two characters and mask the rest
    const firstTwo = part.slice(0, 2);
    const maskLength = part.length - 2;
    return firstTwo + '*'.repeat(maskLength);
  });

  return maskedParts.join(' ');
}

async function getPersonAttributeTypes() {
  const FetchResponse = await openmrsFetch(`${restBaseUrl}/personattributetype?v=custom:(uuid,display)`);
  const personAttributeTypes = FetchResponse.data?.results.map((attributeType) => {
    if (attributeType.display === 'Telephone contact') {
      return {
        phone: attributeType.uuid,
      };
    }
    if (attributeType.display === 'Email address') {
      return {
        email: attributeType.uuid,
      };
    }
    return {
      [attributeType.display]: attributeType.uuid,
    };
  });
  console.log(personAttributeTypes);
  return personAttributeTypes;
}
