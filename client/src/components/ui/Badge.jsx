const VARIANT_CLASS = {
  neutral: 'badge--neutral',
  success: 'badge--success',
  danger: 'badge--danger',
  warning: 'badge--warning',
  brand: 'badge--brand',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return <span className={`badge ${VARIANT_CLASS[variant]} ${className}`.trim()}>{children}</span>;
}
