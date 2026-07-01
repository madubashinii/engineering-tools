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

import { describe, it, expect } from "vitest";
import { formatCompact, formatNumber, formatBytes, formatDate } from "@utils/format";

describe("format utils", () => {
  it("formatNumber adds thousands separators", () => {
    expect(formatNumber(1500)).toBe("1,500");
    expect(formatNumber(0)).toBe("0");
  });

  it("formatNumber handles null", () => {
    expect(formatNumber(null)).toBe("—");
  });

  it("formatCompact abbreviates", () => {
    expect(formatCompact(1500)).toBe("1.5K");
    expect(formatCompact(2_300_000)).toBe("2.3M");
  });

  it("formatCompact handles null/NaN", () => {
    expect(formatCompact(null)).toBe("—");
    expect(formatCompact(undefined)).toBe("—");
  });

  it("formatBytes scales units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formatDate returns dash for empty", () => {
    expect(formatDate("")).toBe("—");
    expect(formatDate(null)).toBe("—");
  });
});
