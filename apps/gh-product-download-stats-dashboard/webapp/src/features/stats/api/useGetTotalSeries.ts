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
import { type SeriesResponse } from "@features/stats/types/stats";
import {
  seriesQueryString,
  type StatsFilters,
} from "@features/stats/utils/filters";

// GET /api/v1/stats/total — cumulative downloads per repo over the range.
export function useGetTotalSeries(
  filters: StatsFilters,
): UseQueryResult<SeriesResponse, Error> {
  const qs = seriesQueryString(filters);
  return useApiQuery<SeriesResponse>(
    [ApiQueryKeys.TOTAL_SERIES, qs],
    `/stats/total?${qs}`,
  );
}
