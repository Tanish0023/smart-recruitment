let googleScriptPromise: Promise<void> | null = null;

async function isBraveBrowser(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined") {
      return false;
    }
    return Boolean((navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }).brave?.isBrave?.());
  } catch {
    return false;
  }
}

function requestGoogleAccessToken(clientId: string): Promise<string> {
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    return Promise.reject(new Error("Google OAuth popup fallback is unavailable in this browser session."));
  }

  return new Promise((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      prompt: "select_account",
      callback: (response) => {
        if (response.error) {
          reject(
            new Error(
              response.error_description || `Google OAuth popup failed (${response.error}). Please retry.`
            )
          );
          return;
        }

        if (!response.access_token) {
          reject(new Error("Google OAuth popup did not return an access token."));
          return;
        }

        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  });
}

function loadGoogleScript(): Promise<void> {
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google OAuth script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google OAuth script"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function requestGoogleIdToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google OAuth is not configured. Missing VITE_GOOGLE_CLIENT_ID.");
  }


  await loadGoogleScript();
  try {
    // Use interactive OAuth popup as the primary flow so the token always returns to this page context.
    return await requestGoogleAccessToken(clientId);
  } catch {
    const isBrave = await isBraveBrowser();
    if (isBrave) {
      throw new Error(
        "Google popup did not complete in Brave. Please allow popups for this site and retry."
      );
    }
    throw new Error(
      "Google sign-in popup failed. Verify authorized JavaScript origins in Google Cloud and retry."
    );
  }
}
