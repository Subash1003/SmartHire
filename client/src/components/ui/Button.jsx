const VARIANT_CLASS = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  danger: 'btn--danger',
};

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn ${VARIANT_CLASS[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
