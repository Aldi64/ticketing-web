/** Loads Midtrans Snap's script once and opens the payment popup. */

interface SnapCallbacks {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

let loading: Promise<void> | null = null;

export function loadSnap(scriptUrl: string, clientKey: string): Promise<void> {
  if (window.snap) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Could not load the payment popup. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });

  return loading;
}

export async function payWithSnap(
  options: { scriptUrl: string; clientKey: string; token: string } & SnapCallbacks,
): Promise<void> {
  await loadSnap(options.scriptUrl, options.clientKey);

  if (!window.snap) throw new Error("The payment popup is not available.");

  window.snap.pay(options.token, {
    onSuccess: options.onSuccess,
    onPending: options.onPending,
    onError: options.onError,
    onClose: options.onClose,
  });
}
