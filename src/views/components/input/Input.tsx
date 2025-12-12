import './input.scss';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className || ''}`}>
        {label && (
          <label htmlFor={props.id} className="input-label">
            {label}
            {props.required && <span className="input-required">*</span>}
          </label>
        )}

        <input
          ref={ref}
          className={`input ${error ? 'input-error' : ''}`}
          {...props}
        />

        {error && <span className="input-error-message">{error}</span>}
        {helperText && !error && <span className="input-helper-text">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
