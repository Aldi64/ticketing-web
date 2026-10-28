import { ApiError } from "@/lib/api-error";

/** Shows an API error: the main message plus every field validation message. */
export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;

  const api = error instanceof ApiError ? error : null;
  const details = Object.values(api?.body.errors ?? {}).flat();

  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <p>{api?.body.message ?? "Something went wrong."}</p>
      {details.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {details.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
