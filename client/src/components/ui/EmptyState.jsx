export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 p-10 text-center">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}
