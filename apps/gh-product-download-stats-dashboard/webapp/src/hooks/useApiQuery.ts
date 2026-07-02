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

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAsgardeo } from "@asgardeo/react";
import { useAuthApiClient } from "@hooks/useAuthApiClient";
import { useLogger } from "@hooks/useLogger";
import { getBackendBaseUrl, API_V1 } from "@config/apiConfig";

// Error carrying the upstream HTTP status, so React Query retry logic can inspect it.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Shared authenticated GET query hook. `path` is relative to `<backend>/api/v1`
 * (e.g. "/stats/summary"). The query is disabled until the user is signed in.
 */
export function useApiQuery<T>(
  queryKey: unknown[],
  path: string,
  enabled = true,
): UseQueryResult<T, Error> {
  const authFetch = useAuthApiClient();
  const { isSignedIn, isLoading: isAuthLoading } = useAsgardeo();
  const logger = useLogger();

  return useQuery<T, Error>({
    queryKey,
    queryFn: async (): Promise<T> => {
      const url = `${getBackendBaseUrl()}${API_V1}${path}`;
      logger.debug(`GET ${path}`);
      const response = await authFetch(url, { method: "GET" });
      if (!response.ok) {
        throw new ApiError(response.status, `Request failed: ${response.status}`);
      }
      return (await response.json()) as T;
    },
    enabled: enabled && isSignedIn && !isAuthLoading,
  });
}
