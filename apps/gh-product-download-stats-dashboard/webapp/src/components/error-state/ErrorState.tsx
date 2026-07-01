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

import { Box, Typography, Button } from "@wso2/oxygen-ui";
import { type JSX } from "react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  minHeight?: number | string;
}

// Inline error placeholder for a failed card/chart/table fetch.
export default function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  minHeight = 200,
}: ErrorStateProps): JSX.Element {
  return (
    <Box
      sx={{
        minHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        textAlign: "center",
        p: 3,
      }}
    >
      <Typography variant="body1" color="error">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      {onRetry && (
        <Button variant="outlined" size="small" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Box>
  );
}
