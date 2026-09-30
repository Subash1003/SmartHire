export default function PageLoading({ label = 'Loading...' }) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
