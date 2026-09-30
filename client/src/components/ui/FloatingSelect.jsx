import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((r) => {
      if (typeof r === 'function') r(node);
      else if (r) r.current = node;
    });
  };
}

// Programmatically sets a native <select>'s value and dispatches a real
// 'change' event, so React's synthetic event system fires any onChange
// handler exactly as if the user had picked the option natively — this is
// what lets react-hook-form's register() and plain controlled onChange
// props keep working unmodified.
function setNativeSelectValue(node, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(node, value);
  node.dispatchEvent(new Event('change', { bubbles: true }));
}

const FloatingSelect = forwardRef(function FloatingSelect(
  { label, id, error, options, className = '', labelBg = 'white', value, defaultValue, onBlur, disabled, ...rest },
  forwardedRef
) {
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(value ?? defaultValue ?? '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const hiddenSelectRef = useRef(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listboxRef = useRef(null);

  // The hidden native <select> is the single source of truth for the form
  // value (react-hook-form reads/writes it directly, including on reset()).
  // Re-check it on every render — cheap, and it's the only reliable way to
  // notice a DOM-level value write that didn't go through our own onSelect.
  useLayoutEffect(() => {
    const node = hiddenSelectRef.current;
    if (node && node.value !== displayValue) {
      setDisplayValue(node.value);
    }
  });

  useLayoutEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useLayoutEffect(() => {
    if (open && highlightedIndex >= 0) {
      listboxRef.current?.children[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  const selectedIndex = options.findIndex((opt) => opt.value === displayValue);
  const selectedOption = options[selectedIndex];

  const openList = () => {
    if (disabled) return;
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const commitOption = (option) => {
    if (!option) return;
    if (hiddenSelectRef.current && hiddenSelectRef.current.value !== option.value) {
      setNativeSelectValue(hiddenSelectRef.current, option.value);
    }
    setDisplayValue(option.value);
    closeList();
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (event) => {
    if (disabled) return;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setHighlightedIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setHighlightedIndex(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commitOption(options[highlightedIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeList();
    } else if (event.key.length === 1) {
      const match = options.findIndex((opt) => opt.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (match >= 0) setHighlightedIndex(match);
    }
  };

  const handleButtonBlur = (event) => {
    // Ignore the blur caused by moving focus into the listbox itself.
    if (containerRef.current && containerRef.current.contains(event.relatedTarget)) return;
    closeList();
    hiddenSelectRef.current?.dispatchEvent(new Event('blur', { bubbles: true }));
    onBlur?.(event);
  };

  const triggerClassName = [
    'form-field__select',
    !label ? 'form-field__select--no-label' : '',
    error ? 'form-field__input--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-field" ref={containerRef}>
      {label && (
        <label htmlFor={id} className={`form-field__label-standard ${error ? 'form-field__label-standard--error' : ''}`}>
          {label}
        </label>
      )}
      <div className="form-field__control">
        <select
          id={id}
          ref={mergeRefs(forwardedRef, hiddenSelectRef)}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          className="form-field__select-native"
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          ref={buttonRef}
          className={triggerClassName}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => (open ? closeList() : openList())}
          onKeyDown={handleButtonKeyDown}
          onBlur={handleButtonBlur}
        >
          <span className="form-field__select-value">{selectedOption?.label ?? ''}</span>
        </button>

        <ChevronDown size={16} className={`form-field__chevron ${open ? 'form-field__chevron--open' : ''}`} />

        {open && (
          <ul className="form-field__listbox" role="listbox" ref={listboxRef} aria-activedescendant={`${id}-option-${highlightedIndex}`}>
            {options.map((opt, index) => (
              <li
                key={opt.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={opt.value === displayValue}
                className={[
                  'form-field__option',
                  opt.value === displayValue ? 'form-field__option--selected' : '',
                  index === highlightedIndex ? 'form-field__option--highlighted' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => commitOption(opt)}
              >
                <span>{opt.label}</span>
                {opt.value === displayValue && <Check size={14} className="form-field__option-check" />}
              </li>
            ))}
          </ul>
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

export default FloatingSelect;
