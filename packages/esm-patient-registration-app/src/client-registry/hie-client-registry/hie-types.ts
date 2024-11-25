export type HIEPatient = fhir.Patient & {
  extension: Array<{
    url: string;
    valueString: string;
  }>;
};

export interface HIEPatientResponse {
  id: string;
  meta: Metadata;
  link: Link[];
  entry: Entry[];
}

interface Metadata {
  lastUpdated: string;
}

interface Link {
  relation: string;
  url: string;
}

interface Entry {
  resource: Resource;
}

interface Resource {
  id: string;
  extension: Extension[];
  identifier: Identifier[];
  active: boolean;
  name: Name[];
  telecom: Telecom[];
  birthDate: string;
  address: Address[];
  gender: string;
  maritalStatus: MaritalStatus;
  contact: Contact[];
}

interface Extension {
  url: string;
  valueString: string;
}

interface Identifier {
  type: CodingType;
  value: string;
}

interface CodingType {
  coding: Coding[];
}

interface Coding {
  system?: string;
  code: string;
  display: string;
}

interface Name {
  text: string;
  family: string;
  given: string[];
}

interface Telecom {
  system: string;
  value?: string;
}

interface Address {
  extension: AddressExtension[];
  city: string;
  country: string;
}

interface AddressExtension {
  url: string;
  valueString: string;
}

interface MaritalStatus {
  coding: Coding[];
}

interface Contact {
  id: string;
  extension: ContactExtension[];
  relationship: Relationship[];
  name: Name;
  telecom: Telecom[];
  address: Address;
  gender: string;
}

interface ContactExtension {
  url: string;
  valueIdentifier?: Identifier;
  valueString?: string;
}

interface Relationship {
  coding: Coding[];
}

export type APIClientConfig = {
  baseUrl: string;
  credentials: string;
};

export interface MapperConfig {
  teleComMap: Record<string, string>;
  addressHierarchyMap: Record<string, string>;
  identifierMap: Record<string, string>;
  addressMap: Record<string, string>;
}

export type ErrorResponse = {
  resourceType: string;
  issue: Array<Issue>;
};

export type Issue = {
  severity: string;
  code: string;
  diagnostics: string;
};
