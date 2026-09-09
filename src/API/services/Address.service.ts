import type {
  AddressFeature,
  AddressFeatureCollection,
  AddressSelectionResult,
  AddressSuggestion,
} from '../../utils/types/index.ts';
import { capitalizeAddress } from '../../utils/scripts/index.ts';

export interface SearchAddressOptions {
  limit?: number;
  postcode?: string;
  type?: string;
  signal?: AbortSignal;
}

export class AddressService {
  private static instance: AddressService;
  private readonly baseUrl = 'https://data.geopf.fr/geocodage/search';

  private constructor() {}

  public static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  /**
   * Recherche des adresses via l'API officielle Base Adresse Nationale (BAN)
   * @param query Terme de recherche saisi (ex: "10 rue de la paix 75002")
   * @param options Paramètres optionnels de filtrage et signal d'annulation
   */
  public async searchAddresses(
    query: string,
    options: SearchAddressOptions = {},
  ): Promise<AddressSuggestion[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return [];
    }

    const params = new URLSearchParams({
      q: trimmedQuery,
      index: 'address',
      autocomplete: '1',
      limit: String(options.limit ?? 5),
    });

    if (options.postcode) {
      params.append('postcode', options.postcode);
    }
    if (options.type) {
      params.append('type', options.type);
    }

    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: options.signal,
      });

      if (!response.ok) {
        throw new Error('Recherche d’adresses indisponible. La saisie manuelle reste possible.');
      }

      const data: unknown = await response.json();
      if (!isAddressCollection(data)) {
        return [];
      }

      return data.features.filter(isAddressFeature).map(this.mapFeatureToSuggestion);
    } catch (error) {
      // Ignorer l'erreur si la requête a été volontairement annulée via AbortController
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Convertit une Feature GeoJSON BAN en AddressSuggestion standardisée
   */
  public mapFeatureToSuggestion(feature: AddressFeature): AddressSuggestion {
    const { properties, geometry } = feature;
    return {
      id: properties.id || `${properties.postcode}_${properties.name}`,
      label: properties.label,
      name: properties.name,
      postcode: properties.postcode,
      city: properties.city,
      citycode: properties.citycode,
      context: properties.context,
      type: properties.type,
      housenumber: properties.housenumber,
      street: properties.street,
      coordinates: geometry?.coordinates,
    };
  }

  /**
   * Convertit une suggestion d'adresse en résultat de sélection exploitable pour les fiches / formulaires
   */
  public toSelectionResult(suggestion: AddressSuggestion): AddressSelectionResult {
    return {
      adresse: capitalizeAddress(suggestion.name),
      code_postal: suggestion.postcode,
      ville: capitalizeAddress(suggestion.city),
      pays: 'France',
      label: capitalizeAddress(suggestion.label),
      context: suggestion.context,
    };
  }
}

export const addressService = AddressService.getInstance();

function isAddressCollection(value: unknown): value is AddressFeatureCollection {
  return typeof value === 'object' && value !== null && 'features' in value && Array.isArray(value.features);
}
function isAddressFeature(value: unknown): value is AddressFeature {
  if (typeof value !== 'object' || value === null || !('properties' in value)) return false;
  const properties = value.properties;
  if (typeof properties !== 'object' || properties === null) return false;
  return ['name', 'label', 'postcode', 'city'].every((key) => key in properties && typeof Reflect.get(properties, key) === 'string');
}
