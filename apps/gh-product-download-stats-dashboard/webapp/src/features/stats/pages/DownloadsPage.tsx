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

import {
  Box,
  Card,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@wso2/oxygen-ui";
import { CalendarDays } from "@wso2/oxygen-ui-icons-react";
import PageHeader from "@components/page-header/PageHeader";
import { type JSX, useEffect, useRef, useState } from "react";
import { usePagination } from "@hooks/usePagination";
import { ROWS_PER_PAGE_OPTIONS } from "@constants/tableConstants";
import { useSearchParams } from "react-router";
import FilterBar from "@features/stats/components/FilterBar";
import ChartCard from "@features/stats/components/ChartCard";
import SeriesChart from "@components/charts/SeriesChart";
import { StatCard } from "@components/stat-card/StatCard";
import { useGetTotalSeries } from "@features/stats/api/useGetTotalSeries";
import { useGetDailySeries } from "@features/stats/api/useGetDailySeries";
import { useGetRepositories } from "@features/stats/api/useGetRepositories";
import { type Interval } from "@features/stats/types/stats";
import {
  parseFilters,
  mergeParams,
  productNameById,
  toChartSeries,
  periodSummary,
  buildDateMatrix,
} from "@features/stats/utils/filters";
import { formatCompact, formatDate } from "@utils/format";

const MODE_OPTIONS: Array<{ value: Interval; label: string }> = [
  { value: "day", label: "Daily" },
  { value: "month", label: "Monthly" },
  { value: "cumulative", label: "Cumulative" },
];

export default function DownloadsPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const isCumulative = filters.interval === "cumulative";
  const [dateSearch, setDateSearch] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const dailyQuery = useGetDailySeries(filters);
  const totalQuery = useGetTotalSeries(filters);
  const activeQuery = isCumulative ? totalQuery : dailyQuery;
  const { data: reposData } = useGetRepositories();

  const series = toChartSeries(
    activeQuery.data?.series ?? [],
    productNameById(reposData?.repositories ?? []),
  );
  const matrix = buildDateMatrix(series);
  const summary = periodSummary(series);

  // Clear picker when interval changes (date format differs between modes).
  useEffect(() => {
    setDateSearch("");
  }, [filters.interval]);

  const filteredDates = dateSearch
    ? matrix.dates.filter((d) => d === dateSearch)
    : matrix.dates;

  const datePagination = usePagination(filteredDates);

  const onChange = (updates: Record<string, string | number[] | null>) =>
    setParams(mergeParams(params, updates), { replace: true });

  const variant: "line" | "bar" = isCumulative
    ? "line"
    : filters.interval === "month"
      ? "bar"
      : "line";

  const title =
    filters.interval === "month"
      ? "Monthly downloads"
      : isCumulative
        ? "Cumulative downloads"
        : "Daily downloads";

  const isMonthly = filters.interval === "month";

  // Formats "YYYY-MM" or "YYYY-MM-DD" as "Jun 2026" for month-view labels.
  function fmtMonthYear(s: string | null): string {
    if (!s) return "—";
    const iso = s.length === 7 ? s + "-01" : s;
    return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const peakLabel = isMonthly
    ? `Highest Month (${fmtMonthYear(summary.peakDate)})`
    : `Highest Day (${formatDate(summary.peakDate)})`;

  const lowLabel = isMonthly
    ? `Lowest Month (${fmtMonthYear(summary.minDate)})`
    : `Lowest Day (${formatDate(summary.minDate)})`;

  const periodRange = isMonthly
    ? `${fmtMonthYear(filters.from)} – ${fmtMonthYear(filters.to)}`
    : `${formatDate(filters.from)} – ${formatDate(filters.to)}`;

  const dateLabel = dateSearch
    ? isMonthly
      ? dateSearch
      : formatDate(dateSearch)
    : null;

  return (
    <Box>
      <PageHeader
        title="Downloads"
        description="Daily, monthly, and cumulative download trends across tracked products and date ranges."
      />

      <FilterBar
        filters={filters}
        onChange={onChange}
        filterSlot={
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>View</InputLabel>
              <Select
                value={filters.interval}
                label="View"
                onChange={(e) => onChange({ interval: e.target.value })}
              >
                {MODE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        }
      />

      <ChartCard
        title={`${title} by product`}
        subtitle="Downloads across the selected products and range"
        showTypeToggle={filters.interval === "day"}
        defaultVariant={variant}
      >
        {(v) => (
          <SeriesChart
            variant={filters.interval === "day" ? v : variant}
            series={series}
            isLoading={activeQuery.isLoading}
            isError={activeQuery.isError}
            onRetry={() => void activeQuery.refetch()}
            xTickFormat="short"
          />
        )}
      </ChartCard>

      {!isCumulative && summary.pointCount > 0 && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            mt: 2,
          }}
        >
          <StatCard
            label={"Average Downloads"}
            value={formatCompact(summary.avgPerPoint)}
            tooltipText={`Average downloads per ${isMonthly ? "month" : "day"} across all selected products in the selected date range`}
          />
          <StatCard
            label={peakLabel}
            value={formatCompact(summary.peakValue)}
          />
          <StatCard label={lowLabel} value={formatCompact(summary.minValue)} />
          <StatCard
            label={`Period Total (${periodRange})`}
            value={formatCompact(summary.total)}
          />
        </Box>
      )}

      <Card sx={{ p: 2, mt: 2, overflowX: "auto" }}>
        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
          {title} table
        </Typography>
        {matrix.dates.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No data for the selected range.
          </Typography>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {/* Date column header with inline calendar picker */}
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      Date
                      <Tooltip
                        title={dateLabel ? "Change date" : "Filter by date"}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            display: "inline-flex",
                          }}
                        >
                          <input
                            ref={dateInputRef}
                            type={
                              filters.interval === "month" ? "month" : "date"
                            }
                            aria-hidden="true"
                            tabIndex={-1}
                            value={dateSearch}
                            onChange={(e) => setDateSearch(e.target.value)}
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              pointerEvents: "none",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                          <IconButton
                            size="small"
                            aria-label={
                              dateLabel
                                ? "Change date filter"
                                : "Filter by date"
                            }
                            onClick={() => dateInputRef.current?.showPicker()}
                          >
                            <CalendarDays size={15} />
                          </IconButton>
                        </Box>
                      </Tooltip>
                      {dateLabel && (
                        <Chip
                          size="small"
                          label={dateLabel}
                          color="primary"
                          onDelete={() => setDateSearch("")}
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  {matrix.columns.map((c) => (
                    <TableCell key={c.key} align="right">
                      {c.name}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <strong>Total</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datePagination.paged.map((date) => (
                  <TableRow key={date}>
                    <TableCell>
                      {filters.interval === "month" ? date : formatDate(date)}
                    </TableCell>
                    {matrix.columns.map((c) => (
                      <TableCell key={c.key} align="right">
                        {formatCompact(matrix.cell(date, c.key) ?? 0)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <strong>
                        {formatCompact(matrix.totalForDate(date))}
                      </strong>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={datePagination.count}
              page={datePagination.page}
              onPageChange={datePagination.onPageChange}
              rowsPerPage={datePagination.rowsPerPage}
              onRowsPerPageChange={datePagination.onRowsPerPageChange}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              showFirstButton
              showLastButton
            />
          </>
        )}
      </Card>
    </Box>
  );
}
