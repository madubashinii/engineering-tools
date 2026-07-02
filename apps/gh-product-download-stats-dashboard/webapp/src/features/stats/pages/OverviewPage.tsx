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

import { Box } from "@wso2/oxygen-ui";
import { type JSX } from "react";
import PageHeader from "@components/page-header/PageHeader";
import KpiCards from "@features/stats/components/KpiCards";
import TopProductsTable from "@features/stats/components/TopProductsTable";
import ChartCard from "@features/stats/components/ChartCard";
import SeriesChart from "@components/charts/SeriesChart";
import { useGetSummary } from "@features/stats/api/useGetSummary";
import { useGetDailySeries } from "@features/stats/api/useGetDailySeries";
import {
  defaultRange,
  toChartSeries,
  type StatsFilters,
} from "@features/stats/utils/filters";

export default function OverviewPage(): JSX.Element {
  const summaryQuery = useGetSummary();

  // Hero chart = DAILY downloads (the primary metric), last 30 days, all products.
  const range = defaultRange();
  const trendFilters: StatsFilters = {
    from: range.from,
    to: range.to,
    repos: [],
    interval: "day",
    metric: "stars",
    version: null,
  };
  const dailyQuery = useGetDailySeries(trendFilters);

  return (
    <Box>
      <PageHeader
        title="Overview"
        description="Download activity and repository stats across all WSO2 products."
      />

      <KpiCards
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          alignItems: "start",
        }}
      >
        <ChartCard title="Daily Downloads (last 30 days)">
          <SeriesChart
            series={toChartSeries(dailyQuery.data?.series ?? [])}
            isLoading={dailyQuery.isLoading}
            isError={dailyQuery.isError}
            onRetry={() => void dailyQuery.refetch()}
            xTickFormat="short"
          />
        </ChartCard>

        <TopProductsTable
          products={summaryQuery.data?.topProducts}
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
      </Box>
    </Box>
  );
}
