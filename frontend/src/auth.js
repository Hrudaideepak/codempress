// Google OAuth client id. Override at build/runtime via VITE_GOOGLE_CLIENT_ID.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "";

const GIS_SCRIPT = "https://accounts.google.com/gsi/client";

let scriptPromise = null;

// Loads the Google Identity Services script once and returns the global `google` object.
export function loadGoogleScript() {
  if (window.google && window.google.accounts) {
    return Promise.resolve(window.google);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}
