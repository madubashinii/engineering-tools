// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { type JSX } from "react";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AsgardeoProvider } from "@asgardeo/react";
import App from "./App";
import { authConfig } from "@config/authConfig";
import { loggerConfig } from "@config/loggerConfig";
import LoggerProvider from "@context/logger/LoggerProvider";
import { ThemePreferenceProvider } from "@context/theme/ThemePreferenceContext";
import { AUTH_SCOPES } from "@constants/authConstants";

// Retry only on transient upstream errors (502/503), up to 3 attempts.
function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 2) return false;
  const status = (error as Error & { status?: number }).status;
  return status === 502 || status === 503;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 60_000,
    },
  },
});

export default function AppWithConfig(): JSX.Element {
  return (
    <AsgardeoProvider
      baseUrl={authConfig.baseUrl}
      clientId={authConfig.clientId}
      afterSignInUrl={authConfig.signInRedirectURL}
      afterSignOutUrl={authConfig.signOutRedirectURL}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - periodicTokenRefresh is supported at runtime
      periodicTokenRefresh
      scopes={[...AUTH_SCOPES]}
      preferences={{
        theme: { inheritFromBranding: false },
        user: { fetchUserProfile: false, fetchOrganizations: false },
      }}
    >
      <BrowserRouter>
        <LoggerProvider config={loggerConfig}>
          <ThemePreferenceProvider>
            <QueryClientProvider client={queryClient}>
              <App />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </ThemePreferenceProvider>
        </LoggerProvider>
      </BrowserRouter>
    </AsgardeoProvider>
  );
}
