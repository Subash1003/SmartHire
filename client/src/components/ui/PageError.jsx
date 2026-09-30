import Button from './Button';

export default function PageError({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="page-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
