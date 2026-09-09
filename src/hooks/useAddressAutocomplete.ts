import { useState, useEffect, useRef, useCallback } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { addressService } from '../API/services/index.ts';
import type {
  AddressSelectionResult,
  AddressSuggestion,
} from '../utils/types/index.ts';

export interface UseAddressAutocompleteOptions {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress: (result: AddressSelectionResult) => void;
  minQueryLength?: number;
  debounceMs?: number;
  disabled?: boolean;
  postcode?: string;
  type?: string;
  limit?: number;
}

export interface UseAddressAutocompleteReturn {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  isOpen: boolean;
  lookupMessage: string;
  highlightedIndex: number;
  containerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  handleInputChange: (value: string) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleSelectSuggestion: (suggestion: AddressSuggestion) => void;
  handleClear: () => void;
  handleFocus: () => void;
  closeDropdown: () => void;
}

export function useAddressAutocomplete({
  value,
  onChange,
  onSelectAddress,
  minQueryLength = 3,
  debounceMs = 250,
  disabled = false,
  postcode,
  type,
  limit = 5,
}: UseAddressAutocompleteOptions): UseAddressAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const lastInputValue = useRef(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recherche d'adresses asynchrone avec annulation des requêtes précédentes
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setLookupMessage('');

      try {
        const results = await addressService.searchAddresses(query, {
          limit,
          postcode,
          type,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setHighlightedIndex(-1);
          if (!results.length) setLookupMessage('Aucune proposition. Vous pouvez conserver votre saisie manuelle.');
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setIsOpen(false);
          setLookupMessage('Recherche indisponible. Vous pouvez saisir l’adresse manuellement.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [limit, postcode, type],
  );

  // Déclenche la recherche avec debouncing
  const triggerDebouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      abortControllerRef.current?.abort();
      setSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
      setIsLoading(false);
      setLookupMessage('');

      const trimmed = query.trim();
      if (trimmed.length < minQueryLength || disabled) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        void fetchSuggestions(trimmed);
      }, debounceMs);
    },
    [debounceMs, disabled, fetchSuggestions, minQueryLength],
  );

  const handleInputChange = useCallback(
    (newValue: string) => {
      lastInputValue.current = newValue;
      onChange(newValue);
      triggerDebouncedSearch(newValue);
    },
    [onChange, triggerDebouncedSearch],
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsOpen(false);
      setSuggestions([]);
      setHighlightedIndex(-1);
      setIsLoading(false);

      const result = addressService.toSelectionResult(suggestion);
      onSelectAddress(result);
    },
    [onSelectAddress],
  );

  const handleClear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    setIsLoading(false);
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleFocus = useCallback(() => {
    if (suggestions.length > 0 && value.trim().length >= minQueryLength) {
      setIsOpen(true);
    }
  }, [minQueryLength, suggestions.length, value]);

  const closeDropdown = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape' || (event.key === 'Tab' && !isOpen)) {
        closeDropdown();
        if (event.key === 'Escape') event.preventDefault();
        return;
      }
      if (!isOpen || suggestions.length === 0) {
        if (event.key === 'ArrowDown' && value.trim().length >= minQueryLength) {
          event.preventDefault();
          triggerDebouncedSearch(value);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prevIndex) =>
            prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0,
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1,
          );
          break;

        case 'Enter':
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            event.preventDefault();
            handleSelectSuggestion(suggestions[highlightedIndex]);
          }
          break;

        case 'Escape':
          event.preventDefault();
          closeDropdown();
          break;

        case 'Tab':
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[highlightedIndex]);
          } else {
            closeDropdown();
          }
          break;

        default:
          break;
      }
    },
    [
      closeDropdown,
      handleSelectSuggestion,
      highlightedIndex,
      isOpen,
      minQueryLength,
      suggestions,
      triggerDebouncedSearch,
      value,
    ],
  );

  // Fermer la liste déroulante lors d'un clic en dehors du composant
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [closeDropdown]);

  useEffect(() => {
    if (disabled || value !== lastInputValue.current) {
      closeDropdown();
      setSuggestions([]);
      setLookupMessage('');
    }
    lastInputValue.current = value;
  }, [value, disabled, closeDropdown]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    lookupMessage,
    isLoading,
    isOpen,
    highlightedIndex,
    containerRef,
    inputRef,
    handleInputChange,
    handleKeyDown,
    handleSelectSuggestion,
    handleClear,
    handleFocus,
    closeDropdown,
  };
}
