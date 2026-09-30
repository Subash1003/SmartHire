export default function KpiCard({ label, value, hint }) {
  return (
    <div className="kpi-card">
      <span className="kpi-card__label">{label}</span>
      <span className="kpi-card__value">{value ?? '—'}</span>
      {hint && <span className="kpi-card__hint">{hint}</span>}
    </div>
  );
}
