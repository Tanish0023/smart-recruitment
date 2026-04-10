interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GooglePromptMomentNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
  }) => void;
  prompt: (listener?: (notification: GooglePromptMomentNotification) => void) => void;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: "none" | "consent" | "select_account" }) => void;
}

interface GoogleAccountsOauth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    prompt?: "none" | "consent" | "select_account";
  }) => GoogleTokenClient;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
      oauth2: GoogleAccountsOauth2;
    };
  };
}
