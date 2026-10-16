"use client";

/** Visible load/action error. Renders nothing when there is no message. */
export default function ErrorBanner({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-3 font-medium underline">
          Reintentar
        </button>
      )}
    </div>
  );
}
