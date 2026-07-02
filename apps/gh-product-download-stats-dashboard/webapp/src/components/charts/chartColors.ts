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

// Stable, color-blind-friendly palette for multi-series charts.
export const CHART_PALETTE = [
  "#2563EB",
  "#F97316",
  "#16A34A",
  "#9333EA",
  "#DC2626",
  "#0891B2",
  "#CA8A04",
  "#DB2777",
  "#4F46E5",
  "#65A30D",
] as const;

// Picks a deterministic color for a series by index.
export function seriesColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

// Stable color for a known product/series name, so the same product keeps the
// same color across every page. Unknown names hash deterministically into the palette.
const PRODUCT_COLORS: Record<string, string> = {
  "product-apim": "#2563EB",
  "WSO2 API Manager": "#2563EB",
  "product-is": "#16A34A",
  "WSO2 Identity Server": "#16A34A",
  "micro-integrator": "#9333EA",
  "WSO2 Micro Integrator": "#9333EA",
  apk: "#F97316",
  "WSO2 APK": "#F97316",
  "product-microgateway": "#DB2777",
  "product-apim-tooling": "#0891B2",
  "streaming-integrator": "#CA8A04",
  "WSO2 Streaming Integrator": "#CA8A04",
};

export function colorForName(name: string): string {
  if (PRODUCT_COLORS[name]) return PRODUCT_COLORS[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CHART_PALETTE[h % CHART_PALETTE.length];
}
