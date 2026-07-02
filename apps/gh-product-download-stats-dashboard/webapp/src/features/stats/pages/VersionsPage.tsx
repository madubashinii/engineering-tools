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
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@wso2/oxygen-ui";
import {
  ChevronDown,
  ChevronUp,
  Info,
  ListFilter,
} from "@wso2/oxygen-ui-icons-react";
import { type JSX, useEffect, useRef, useState } from "react";
import PageHeader from "@components/page-header/PageHeader";
import { usePagination } from "@hooks/usePagination";
import { ROWS_PER_PAGE_OPTIONS } from "@constants/tableConstants";
import { useSearchParams } from "react-router";
import ChartCard from "@features/stats/components/ChartCard";
import SeriesChart, { type ChartSeries } from "@components/charts/SeriesChart";
import EmptyState from "@components/empty-state/EmptyState";
import ErrorState from "@components/error-state/ErrorState";
import { useGetRepositories } from "@features/stats/api/useGetRepositories";
import { useGetVersionSeries } from "@features/stats/api/useGetVersionSeries";
import { useGetAssetBreakdown } from "@features/stats/api/useGetAssetBreakdown";
import { type Interval, type VersionSeries } from "@features/stats/types/stats";
import { parseFilters, mergeParams } from "@features/stats/utils/filters";
import { formatCompact, formatBytes } from "@utils/format";

const MODE_OPTIONS: Array<{ value: Interval; label: string }> = [
  { value: "day", label: "Daily" },
  { value: "month", label: "Monthly" },
  { value: "cumulative", label: "Cumulative" },
];

function toChart(series: VersionSeries[]): ChartSeries[] {
  return series.map((v) => ({
    key: v.releaseTag,
    name: v.releaseName || v.releaseTag,
    points: v.points,
  }));
}

export default function VersionsPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const { data: reposData } = useGetRepositories();
  const repos = reposData?.repositories ?? [];

  const repoParam = Number(params.get("repo"));
  const repoId = repoParam > 0 ? repoParam : (repos[0]?.id ?? null);

  // Single-version selection for the Assets panel (row click).
  const [version, setVersion] = useState<string | null>(null);
  const defaultVersionRepoId = useRef<number | null>(null);

  // Multi-select filter for which versions appear in the chart + by-version table.
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const seriesQuery = useGetVersionSeries(
    repoId,
    filters.from,
    filters.to,
    filters.interval,
  );
  const assetsQuery = useGetAssetBreakdown(
    repoId,
    filters.from,
    filters.to,
    version,
  );

  const series = seriesQuery.data?.series ?? [];

  // Auto-select the latest version (tag desc) for the Assets panel when data first loads.
  useEffect(() => {
    if (series.length > 0 && defaultVersionRepoId.current !== repoId) {
      const latestTag =
        [...series].sort((a, b) => b.releaseTag.localeCompare(a.releaseTag))[0]
          ?.releaseTag ?? null;
      setVersion(latestTag);
      defaultVersionRepoId.current = repoId;
    }
  }, [series, repoId]);

  // Reset multi-select and version default tracking when the product changes.
  useEffect(() => {
    setSelectedVersions([]);
    setVersion(null);
    defaultVersionRepoId.current = null;
  }, [repoId]);

  const onChange = (updates: Record<string, string | number[] | null>) =>
    setParams(mergeParams(params, updates), { replace: true });

  // Build rows from all series (unfiltered) — used for dropdown options.
  const allRows = series
    .map((v) => {
      const total = v.points.reduce((a, p) => a + p.value, 0);
      return {
        tag: v.releaseTag,
        name: v.releaseName || v.releaseTag,
        total,
        avg: v.points.length ? Math.round(total / v.points.length) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Apply version multi-select filter for chart and by-version table.
  const filteredSeries =
    selectedVersions.length > 0
      ? series.filter((v) => selectedVersions.includes(v.releaseTag))
      : series;

  const displayRows =
    selectedVersions.length > 0
      ? allRows.filter((r) => selectedVersions.includes(r.tag))
      : allRows;

  const grandTotal = displayRows.reduce((acc, r) => acc + r.total, 0);
  const rowsWithShare = displayRows.map((r) => ({
    ...r,
    share: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));

  const assets = assetsQuery.data?.assets ?? [];
  const versionPagination = usePagination(rowsWithShare);
  const assetPagination = usePagination(assets);

  const variant = filters.interval === "month" ? "bar" : "line";

  return (
    <Box>
      <PageHeader
        title="Versions"
        description="Per-release download breakdown and asset-level stats for each tracked product."
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Always-visible: product + version multi-select + filter toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
            <InputLabel>Product</InputLabel>
            <Select
              value={repoId ?? ""}
              label="Product"
              onChange={(e) => {
                setVersion(null);
                onChange({ repo: String(e.target.value) });
              }}
            >
              {repos.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.productName || r.repoName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Version</InputLabel>
            <Select
              multiple
              value={selectedVersions}
              label="Version"
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVersions(Array.isArray(val) ? val : [val]);
              }}
              renderValue={(selected) => {
                if (selected.length === 0) return "All versions";
                if (selected.length === 1) return selected[0];
                return `${selected.length} versions`;
              }}
            >
              {allRows.map((r) => (
                <MenuItem key={r.tag} value={r.tag}>
                  <Checkbox
                    size="small"
                    checked={selectedVersions.includes(r.tag)}
                  />
                  <ListItemText primary={r.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => setFiltersOpen((o) => !o)}
            startIcon={<ListFilter size={16} />}
            endIcon={
              filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            }
          >
            Filters
          </Button>
        </Box>

        {/* Collapsible: date range + interval */}
        {filtersOpen && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="From"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={filters.from}
                  onChange={(e) => onChange({ from: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="To"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={filters.to}
                  onChange={(e) => onChange({ to: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Interval</InputLabel>
                  <Select
                    value={filters.interval}
                    label="Interval"
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
            </Grid>
          </>
        )}
      </Paper>

      <ChartCard
        title="Downloads by version"
        subtitle="One series per release tag"
        showTypeToggle={filters.interval !== "month"}
        defaultVariant={variant}
      >
        {(v) => (
          <SeriesChart
            variant={filters.interval === "month" ? "bar" : v}
            series={toChart(filteredSeries)}
            isLoading={seriesQuery.isLoading}
            isError={seriesQuery.isError}
            onRetry={() => void seriesQuery.refetch()}
            emptyTitle="No release data for this product / range"
          />
        )}
      </ChartCard>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          mt: 2,
        }}
      >
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
            Versions
          </Typography>
          {seriesQuery.isError ? (
            <ErrorState minHeight={160} />
          ) : rowsWithShare.length === 0 ? (
            <EmptyState title="No versions found" minHeight={160} />
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Tag</TableCell>
                    <TableCell align="right">Downloads</TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title="Percentage of total downloads across all displayed versions in the selected date range"
                        placement="top"
                      >
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            cursor: "help",
                          }}
                        >
                          Share
                          <Info size={13} style={{ opacity: 0.5 }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {versionPagination.paged.map((r) => (
                    <TableRow
                      key={r.tag}
                      hover
                      selected={version === r.tag}
                      role="button"
                      tabIndex={0}
                      sx={{ cursor: "pointer" }}
                      onClick={() =>
                        setVersion(version === r.tag ? null : r.tag)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setVersion(version === r.tag ? null : r.tag);
                        }
                      }}
                    >
                      <TableCell>{r.name}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                          }}
                        >
                          {r.tag}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {formatCompact(r.total)}
                      </TableCell>
                      <TableCell align="right">{r.share.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={versionPagination.count}
                page={versionPagination.page}
                onPageChange={versionPagination.onPageChange}
                rowsPerPage={versionPagination.rowsPerPage}
                onRowsPerPageChange={versionPagination.onRowsPerPageChange}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                showFirstButton
                showLastButton
              />
            </>
          )}
        </Card>

        <Card sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6" component="h3">
              Assets
            </Typography>
            {version ? (
              <Chip
                size="small"
                label={version}
                color="primary"
                onDelete={() => setVersion(null)}
              />
            ) : (
              <Tooltip
                title="Click a version row to filter assets by that release"
                placement="right"
              >
                <Info size={15} style={{ opacity: 0.45, cursor: "help" }} />
              </Tooltip>
            )}
          </Box>
          {assetsQuery.isError ? (
            <ErrorState minHeight={160} />
          ) : assets.length === 0 ? (
            <EmptyState title="No asset data" minHeight={160} />
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="right">Downloads</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assetPagination.paged.map((a) => (
                    <TableRow key={a.assetGithubId}>
                      <TableCell>{a.assetName}</TableCell>
                      <TableCell align="right">
                        {formatBytes(a.assetSize)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCompact(a.downloadCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={assetPagination.count}
                page={assetPagination.page}
                onPageChange={assetPagination.onPageChange}
                rowsPerPage={assetPagination.rowsPerPage}
                onRowsPerPageChange={assetPagination.onRowsPerPageChange}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                showFirstButton
                showLastButton
              />
            </>
          )}
        </Card>
      </Box>
    </Box>
  );
}
