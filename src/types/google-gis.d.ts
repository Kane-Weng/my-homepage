// Minimal typings for the Google Identity Services token client we use.
export {};

declare global {
  interface GisTokenResponse {
    access_token: string;
    expires_in: number;
    error?: string;
    error_description?: string;
  }

  interface GisTokenClient {
    requestAccessToken: (overrides?: { prompt?: "" | "none" | "consent" }) => void;
  }

  const google: {
    accounts: {
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (resp: GisTokenResponse) => void;
        }) => GisTokenClient;
      };
    };
  };
}
