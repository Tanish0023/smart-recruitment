let googleScriptPromise: Promise<void> | null = null;

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
  const googleIdentity = window.google?.accounts?.id;
  if (!googleIdentity) {
    throw new Error("Google OAuth is unavailable in this browser session.");
  }

  return new Promise((resolve, reject) => {
    let received = false;
    let settled = false;

    const fail = (message: string) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new Error(message));
    };

    const succeed = (credential: string) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(credential);
    };

    const timeoutId = window.setTimeout(() => {
      fail(`Google sign-in timed out. Verify authorized JavaScript origins and try again.`);
    }, 15000);

    googleIdentity.initialize({
      client_id: clientId,
      callback: (response) => {
        received = true;
        const credential = response.credential;
        if (!credential) {
          window.clearTimeout(timeoutId);
          fail("Google did not return a credential token.");
          return;
        }
        window.clearTimeout(timeoutId);
        succeed(credential);
      },
      cancel_on_tap_outside: true,
      ux_mode: "popup",
      auto_select: false,
    });

    googleIdentity.prompt((notification) => {
      if (received) {
        return;
      }

      const skipped = notification.isSkippedMoment?.() ?? false;
      const dismissed = notification.isDismissedMoment?.() ?? false;
      const notDisplayed = notification.isNotDisplayed?.() ?? false;

      if (notDisplayed) {
        const reason = notification.getNotDisplayedReason?.() ?? "unknown_reason";
        window.clearTimeout(timeoutId);
        fail(`Google sign-in could not be displayed (${reason}). Check OAuth client origin settings.`);
        return;
      }

      if (skipped) {
        const reason = notification.getSkippedReason?.() ?? "unknown_reason";
        window.clearTimeout(timeoutId);
        fail(`Google sign-in was skipped (${reason}). Try again or use another browser profile.`);
        return;
      }

      if (dismissed) {
        const reason = notification.getDismissedReason?.() ?? "unknown_reason";
        if (reason !== "credential_returned") {
          window.clearTimeout(timeoutId);
          fail(`Google sign-in was dismissed (${reason}).`);
        }
      }
    });
  });
}
