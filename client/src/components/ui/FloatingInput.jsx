import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FloatingInput = forwardRef(function FloatingInput(
  { label, id, error, className = '', type = 'text', icon: Icon, labelBg = 'white', ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const isSearch = type === 'search';
  const effectiveType = isPassword ? (visible ? 'text' : 'password') : type;

  const inputClassName = [
    'form-field__input',
    Icon ? 'form-field__input--with-icon' : '',
    isPassword ? 'form-field__input--with-toggle' : '',
    error ? 'form-field__input--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`form-field ${labelBg === 'muted' ? 'form-field--muted' : ''}`}>
      <div className="form-field__control">
        <input
          id={id}
          ref={ref}
          type={effectiveType}
          placeholder={isSearch ? label : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-label={isSearch ? label : undefined}
          className={inputClassName}
          {...rest}
        />

        {Icon && <Icon size={16} className="form-field__icon" />}

        {!isSearch && (
          <label htmlFor={id} className={`form-field__label ${error ? 'form-field__label--error' : ''}`}>
            {label}
          </label>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="form-field__toggle"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="form-field__error">
          {error}
        </p>
      )}
    </div>
  );
});

export default FloatingInput;
