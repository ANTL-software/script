export type AddressType = 'housenumber' | 'street' | 'locality' | 'municipality';

export interface AddressProperties {
  id: string;
  label: string;
  score: number;
  housenumber?: string;
  name: string;
  postcode: string;
  citycode?: string;
  city: string;
  district?: string;
  context?: string;
  type: AddressType;
  street?: string;
}

export interface AddressGeometry {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface AddressFeature {
  type: 'Feature';
  geometry: AddressGeometry;
  properties: AddressProperties;
}

export interface AddressFeatureCollection {
  type: 'FeatureCollection';
  version: string;
  features: AddressFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

export interface AddressSuggestion {
  id: string;
  label: string;
  name: string;
  postcode: string;
  city: string;
  citycode?: string;
  context?: string;
  type?: AddressType;
  housenumber?: string;
  street?: string;
  coordinates?: [number, number];
}

export interface AddressSelectionResult {
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  label: string;
  context?: string;
}
