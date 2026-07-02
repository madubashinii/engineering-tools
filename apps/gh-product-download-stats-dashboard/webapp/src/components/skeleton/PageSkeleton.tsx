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

import { Box, Card, Skeleton } from "@wso2/oxygen-ui";
import { type JSX } from "react";

// Content-shaped loading placeholder shown while a route chunk loads or auth is
// initialising — a smooth skeleton dashboard rather than a progress line.
export default function PageSkeleton(): JSX.Element {
  return (
    <Box>
      <Skeleton variant="text" width={220} height={44} sx={{ mb: 2 }} />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
          mb: 2,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} sx={{ p: 2.5 }}>
            <Skeleton variant="circular" width={36} height={36} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="55%" height={32} />
            <Skeleton variant="text" width="40%" />
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        }}
      >
        <Card sx={{ p: 2 }}>
          <Skeleton variant="text" width={180} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={300} />
        </Card>
        <Card sx={{ p: 2 }}>
          <Skeleton variant="text" width={140} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={300} />
        </Card>
      </Box>
    </Box>
  );
}
