export type HIEPatient = fhir.Patient & {
  extension: Array<{
    url: string;
    valueString: string;
  }>;
};

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
