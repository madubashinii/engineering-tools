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
  Card,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Skeleton,
  Box,
} from "@wso2/oxygen-ui";
import { type JSX } from "react";
import { usePagination } from "@hooks/usePagination";
import { ROWS_PER_PAGE_OPTIONS } from "@constants/tableConstants";
import EmptyState from "@components/empty-state/EmptyState";
import ErrorState from "@components/error-state/ErrorState";
import { formatCompact } from "@utils/format";
import { type CompareItem } from "@features/stats/types/stats";

interface CompareTableProps {
  items?: CompareItem[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function CompareTable({
  items,
  isLoading,
  isError,
}: CompareTableProps): JSX.Element {
  const pagination = usePagination(items ?? []);

  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Comparison
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={36} />
          ))}
        </Box>
      ) : isError ? (
        <ErrorState minHeight={160} />
      ) : !items || items.length === 0 ? (
        <EmptyState title="No comparison data" minHeight={160} />
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Repository</TableCell>
                <TableCell align="right">Total downloads</TableCell>
                <TableCell align="right">Downloads in range</TableCell>
                <TableCell align="right">Stars</TableCell>
                <TableCell align="right">Forks</TableCell>
                <TableCell align="right">Clones in range</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagination.paged.map((item) => (
                <TableRow key={item.repoId}>
                  <TableCell>{item.repoName}</TableCell>
                  <TableCell align="right">
                    {formatCompact(item.totalDownloads)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCompact(item.downloadsInRange)}
                  </TableCell>
                  <TableCell align="right">{formatCompact(item.stars)}</TableCell>
                  <TableCell align="right">{formatCompact(item.forks)}</TableCell>
                  <TableCell align="right">
                    {formatCompact(item.clonesInRange)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={pagination.count}
            page={pagination.page}
            onPageChange={pagination.onPageChange}
            rowsPerPage={pagination.rowsPerPage}
            onRowsPerPageChange={pagination.onRowsPerPageChange}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            showFirstButton
            showLastButton
          />
        </>
      )}
    </Card>
  );
}
