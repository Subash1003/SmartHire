import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const FloatingSelect = forwardRef(function FloatingSelect(
  { label, id, error, options, className = '', labelBg = 'white', ...rest },
  ref
) {
  const selectClassName = [
    'form-field__select',
    !label ? 'form-field__select--no-label' : '',
    error ? 'form-field__input--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`form-field ${labelBg === 'muted' ? 'form-field--muted' : ''}`}>
      <div className="form-field__control">
        <select
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={selectClassName}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {label && (
          <label htmlFor={id} className={`form-field__label ${error ? 'form-field__label--error' : ''}`}>
            {label}
          </label>
        )}

        <ChevronDown size={16} className="form-field__chevron" />
      </div>
      {error && (
        <p id={`${id}-error`} className="form-field__error">
          {error}
        </p>
      )}
    </div>
  );
});

export default FloatingSelect;
