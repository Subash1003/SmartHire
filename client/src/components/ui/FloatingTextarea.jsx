import { forwardRef } from 'react';

const FloatingTextarea = forwardRef(function FloatingTextarea(
  { label, id, error, className = '', rows = 4, labelBg = 'white', ...rest },
  ref
) {
  const textareaClassName = ['form-field__textarea', error ? 'form-field__input--error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`form-field ${labelBg === 'muted' ? 'form-field--muted' : ''}`}>
      <div className="form-field__control">
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={textareaClassName}
          {...rest}
        />
        <label htmlFor={id} className={`form-field__label ${error ? 'form-field__label--error' : ''}`}>
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="form-field__error">
          {error}
        </p>
      )}
    </div>
  );
});

export default FloatingTextarea;
