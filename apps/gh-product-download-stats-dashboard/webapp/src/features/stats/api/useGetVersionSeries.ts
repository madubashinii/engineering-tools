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

import { type UseQueryResult } from "@tanstack/react-query";
import { useApiQuery } from "@hooks/useApiQuery";
import { ApiQueryKeys } from "@constants/apiConstants";
import {
  type Interval,
  type VersionSeriesResponse,
} from "@features/stats/types/stats";

// GET /api/v1/stats/versions/{repoId}/series — per-version download time series
// (daily delta / monthly sum / cumulative).
export function useGetVersionSeries(
  repoId: number | null,
  from: string,
  to: string,
  interval: Interval,
): UseQueryResult<VersionSeriesResponse, Error> {
  const enabled = repoId != null && repoId > 0;
  const path = `/stats/versions/${repoId}/series?from=${from}&to=${to}&interval=${interval}`;
  return useApiQuery<VersionSeriesResponse>(
    [ApiQueryKeys.VERSION_BREAKDOWN, "series", repoId, from, to, interval],
    path,
    enabled,
  );
}
