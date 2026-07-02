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

import { Box, FormControl, Grid, InputLabel, MenuItem, Select } from "@wso2/oxygen-ui";
import PageHeader from "@components/page-header/PageHeader";
import { type JSX, useState } from "react";
import { useSearchParams } from "react-router";
import FilterBar from "@features/stats/components/FilterBar";
import ChartCard from "@features/stats/components/ChartCard";
import CompareTable from "@features/stats/components/CompareTable";
import SeriesChart from "@components/charts/SeriesChart";
import EmptyState from "@components/empty-state/EmptyState";
import { useGetTotalSeries } from "@features/stats/api/useGetTotalSeries";
import { useGetDailySeries } from "@features/stats/api/useGetDailySeries";
import { useGetMetricSeries } from "@features/stats/api/useGetMetricSeries";
import { useGetCompare } from "@features/stats/api/useGetCompare";
import { type Metric } from "@features/stats/types/stats";
import {
  parseFilters,
  mergeParams,
  toChartSeries,
} from "@features/stats/utils/filters";

type CompareMetric = "dailyDownloads" | "cumulative" | "stars" | "forks";

const METRIC_OPTIONS: Array<{ value: CompareMetric; label: string }> = [
  { value: "dailyDownloads", label: "Daily Downloads" },
  { value: "cumulative", label: "Cumulative Downloads" },
  { value: "stars", label: "Stars" },
  { value: "forks", label: "Forks" },
];

export default function ComparePage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const hasRepos = filters.repos.length > 0;
  const [metric, setMetric] = useState<CompareMetric>("dailyDownloads");

  const dailyQuery = useGetDailySeries(filters);
  const totalQuery = useGetTotalSeries(filters);
  const gaugeMetric: Metric = metric === "forks" ? "forks" : "stars";
  const metricQuery = useGetMetricSeries({ ...filters, metric: gaugeMetric });
  const compareQuery = useGetCompare(filters.repos, filters.from, filters.to);

  const activeQuery =
    metric === "cumulative"
      ? totalQuery
      : metric === "stars" || metric === "forks"
        ? metricQuery
        : dailyQuery;

  const onChange = (updates: Record<string, string | number[] | null>) =>
    setParams(mergeParams(params, updates), { replace: true });

  const label = METRIC_OPTIONS.find((o) => o.value === metric)?.label ?? "";

  return (
    <Box>
      <PageHeader
        title="Comparison"
        description="Side-by-side download and engagement metrics across multiple products."
      />

      <FilterBar
        filters={filters}
        onChange={onChange}
        filterSlot={
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Metric</InputLabel>
              <Select
                value={metric}
                label="Metric"
                onChange={(e) => setMetric(e.target.value as CompareMetric)}
              >
                {METRIC_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        }
      />

      {!hasRepos ? (
        <EmptyState
          title="Select products to compare"
          description="Pick two or more products above to see them side by side."
          minHeight={240}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ChartCard
            title={`${label} comparison`}
            subtitle="Overlaid series for the selected products"
            showTypeToggle
          >
            {(v) => (
              <SeriesChart
                variant={v}
                series={toChartSeries(activeQuery.data?.series ?? [])}
                isLoading={activeQuery.isLoading}
                isError={activeQuery.isError}
                onRetry={() => void activeQuery.refetch()}
              />
            )}
          </ChartCard>

          <CompareTable
            items={compareQuery.data?.items}
            isLoading={compareQuery.isLoading}
            isError={compareQuery.isError}
          />
        </Box>
      )}
    </Box>
  );
}
