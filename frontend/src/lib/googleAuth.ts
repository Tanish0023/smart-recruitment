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

function openGoogleAccountChooser(): void {
  const googleChooserUrl =
    "https://accounts.google.com/AccountChooser?continue=https%3A%2F%2Faccounts.google.com%2F";
  window.open(googleChooserUrl, "_blank", "noopener,noreferrer");
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

async function getGoogleSkippedMessage(reason: string): Promise<string> {
  const isBrave = await isBraveBrowser();

  if (reason === "opt_out_or_no_session") {
    if (isBrave) {
      return "Brave blocked the Google session handshake. We opened Google account chooser in a new tab. Complete sign-in/account selection there, then try again. If needed, lower Shields for this site and allow third-party cookies/popups.";
    }
    return "No active Google session found. Please sign in to Gmail in this browser, then try Google sign-in again.";
  }

  if (reason === "browser_not_supported") {
    return "Google sign-in is not supported in this browser profile. Try another profile or browser.";
  }

  return `Google sign-in was skipped (${reason}). Try again or use another browser profile.`;
}

async function getGoogleNotDisplayedMessage(reason: string): Promise<string> {
  const isBrave = await isBraveBrowser();

  if (reason === "opt_out_or_no_session") {
    if (isBrave) {
      return "Brave blocked Google sign-in for this site. We opened Google account chooser in a new tab. Complete it, then retry. If this repeats, lower Shields for this site and allow third-party cookies/popups.";
    }
    return "No active Google session found. Please sign in to Gmail and retry Google sign-in.";
  }

  if (reason === "suppressed_by_user") {
    if (isBrave) {
      return "Google sign-in was suppressed by Brave privacy settings. Please lower Shields for this site and allow third-party cookies/popups, then retry.";
    }
    return "Google sign-in was suppressed by browser privacy settings. Please retry after enabling cookies/popups for this site.";
  }

  if (reason === "secure_http_required") {
    return "Google sign-in requires a secure origin (HTTPS or localhost).";
  }

  return `Google sign-in could not be displayed (${reason}). Check OAuth client origin settings.`;
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
  const googleIdentity = window.google?.accounts?.id;
  if (!googleIdentity) {
    throw new Error("Google OAuth is unavailable in this browser session.");
  }

  return new Promise((resolve, reject) => {
    let received = false;
    let settled = false;

    const failWithPopupFallback = async (message: string) => {
      try {
        const fallbackToken = await requestGoogleAccessToken(clientId);
        succeed(fallbackToken);
      } catch {
        fail(message);
      }
    };

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
        if (reason === "opt_out_or_no_session") {
          openGoogleAccountChooser();
        }
        void getGoogleNotDisplayedMessage(reason).then((message) => {
          void failWithPopupFallback(message);
        });
        return;
      }

      if (skipped) {
        const reason = notification.getSkippedReason?.() ?? "unknown_reason";
        window.clearTimeout(timeoutId);
        if (reason === "opt_out_or_no_session") {
          openGoogleAccountChooser();
        }
        void getGoogleSkippedMessage(reason).then((message) => {
          void failWithPopupFallback(message);
        });
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
