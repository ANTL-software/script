import './addressAutocomplete.scss';
import { forwardRef, useId } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useAddressAutocomplete } from '../../../hooks/index.ts';
import type {
  AddressSelectionResult,
  AddressSuggestion,
} from '../../../utils/types/index.ts';

export interface AddressAutocompleteProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectAddress: (result: AddressSelectionResult) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  minQueryLength?: number;
  debounceMs?: number;
  postcode?: string;
  type?: string;
  showClearButton?: boolean;
}

const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      onSelectAddress,
      placeholder = 'Rechercher une adresse (ex: 10 rue de la paix 75002)...',
      required = false,
      disabled = false,
      error,
      helperText,
      className,
      minQueryLength = 3,
      debounceMs = 250,
      postcode,
      type,
      showClearButton = true,
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const listboxId = `${inputId}-listbox`;

    const {
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
    } = useAddressAutocomplete({
      value,
      onChange,
      onSelectAddress,
      minQueryLength,
      debounceMs,
      disabled,
      postcode,
      type,
    });

    const setInputRefs = (element: HTMLInputElement | null) => {
      // Assigner à la ref interne du hook
      inputRef.current = element;
      // Assigner à la ref passée par forwardRef
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    return (
      <div
        ref={containerRef}
        className={`address-autocomplete-wrapper ${className || ''}`}
      >
        {label && (
          <label htmlFor={inputId} className="address-autocomplete-label">
            {label}
            {required && <span className="address-autocomplete-required">*</span>}
          </label>
        )}

        <div className="address-autocomplete-input-box">
          <span className="address-autocomplete-icon" aria-hidden="true">
            <FaMapMarkerAlt />
          </span>

          <input
            ref={setInputRefs}
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-describedby={`${inputId}-help`}
            aria-invalid={Boolean(error)}
            aria-activedescendant={
              highlightedIndex >= 0 ? `${inputId}-opt-${highlightedIndex}` : undefined
            }
            className={`address-autocomplete-input ${error ? 'address-autocomplete-input--error' : ''}`}
            value={value}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete="off"
          />

          <div className="address-autocomplete-actions">
            {isLoading && (
              <span
                className="address-autocomplete-spinner"
                title="Recherche en cours..."
                aria-label="Recherche d'adresses en cours"
              >
                <FaSpinner className="spinner-icon" />
              </span>
            )}

            {!isLoading && showClearButton && value && !disabled && (
              <button
                type="button"
                className="address-autocomplete-clear-btn"
                onClick={handleClear}
                title="Effacer"
                aria-label="Effacer le champ adresse"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {error && <span className="address-autocomplete-error-message">{error}</span>}
        {helperText && !error && (
          <span className="address-autocomplete-helper-text">{helperText}</span>
        )}
        <span id={`${inputId}-help`} className="address-autocomplete-helper-text" role="status">{lookupMessage || 'Suggestions officielles IGN / BAN — saisie manuelle toujours possible.'}</span>

        {isOpen && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="address-autocomplete-dropdown"
            aria-label="Suggestions d'adresses"
          >
            {suggestions.map((suggestion: AddressSuggestion, index: number) => {
              const isHighlighted = index === highlightedIndex;
              const isHouseNumber = suggestion.type === 'housenumber';

              return (
                <li
                  key={suggestion.id || `${suggestion.postcode}-${suggestion.name}-${index}`}
                  id={`${inputId}-opt-${index}`}
                  role="option"
                  aria-selected={isHighlighted}
                  className={`address-autocomplete-item ${
                    isHighlighted ? 'address-autocomplete-item--highlighted' : ''
                  }`}
                  onMouseDown={(event) => {
                    // Empêcher le blur de l'input avant le clic
                    event.preventDefault();
                    handleSelectSuggestion(suggestion);
                  }}
                >
                  <div className="address-autocomplete-item-main">
                    <span className="address-autocomplete-item-name">
                      {suggestion.name}
                    </span>
                    {isHouseNumber && (
                      <span className="address-autocomplete-badge-ban">
                        <FaCheckCircle className="badge-icon" /> BAN
                      </span>
                    )}
                  </div>
                  <div className="address-autocomplete-item-meta">
                    <span className="address-autocomplete-item-city">
                      {suggestion.postcode} {suggestion.city}
                    </span>
                    {suggestion.context && (
                      <span className="address-autocomplete-item-context">
                        ({suggestion.context})
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            <li
              className="address-autocomplete-item address-autocomplete-item--manual"
              onMouseDown={(event) => {
                event.preventDefault();
                closeDropdown();
              }}
            >
              <span className="address-autocomplete-manual-text">
                ✍️ Utiliser telle quelle : <strong>&quot;{value}&quot;</strong> (saisie libre)
              </span>
            </li>
          </ul>
        )}
      </div>
    );
  },
);

AddressAutocomplete.displayName = 'AddressAutocomplete';

export default AddressAutocomplete;
