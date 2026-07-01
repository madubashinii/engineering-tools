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
import {
  parseFilters,
  mergeParams,
  seriesQueryString,
  toChartSeries,
} from "@features/stats/utils/filters";

describe("stats filters", () => {
  it("parseFilters applies defaults", () => {
    const f = parseFilters(new URLSearchParams(""));
    expect(f.repos).toEqual([]);
    expect(f.interval).toBe("day");
    expect(f.metric).toBe("stars");
    expect(f.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(f.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parseFilters reads and sanitizes params", () => {
    const f = parseFilters(
      new URLSearchParams("repos=1,2,x&interval=month&metric=forks"),
    );
    expect(f.repos).toEqual([1, 2]);
    expect(f.interval).toBe("month");
    expect(f.metric).toBe("forks");
  });

  it("parseFilters falls back on invalid metric", () => {
    expect(parseFilters(new URLSearchParams("metric=bogus")).metric).toBe("stars");
  });

  it("mergeParams sets arrays and clears empties", () => {
    const p = mergeParams(new URLSearchParams("a=1"), { repos: [1, 2], b: null });
    expect(p.get("repos")).toBe("1,2");
    expect(p.get("a")).toBe("1");
    expect(p.get("b")).toBeNull();

    const cleared = mergeParams(p, { repos: [] });
    expect(cleared.get("repos")).toBeNull();
  });

  it("seriesQueryString includes range, repos, interval", () => {
    const qs = seriesQueryString({
      from: "2026-06-01",
      to: "2026-06-25",
      repos: [1],
      interval: "day",
      metric: "stars",
      version: null,
    });
    expect(qs).toContain("from=2026-06-01");
    expect(qs).toContain("to=2026-06-25");
    expect(qs).toContain("repos=1");
    expect(qs).toContain("interval=day");
  });

  it("toChartSeries maps repo series to chart series", () => {
    const cs = toChartSeries([
      { repoId: 1, repoName: "apim", points: [{ date: "2026-06-01", value: 5 }] },
    ]);
    expect(cs[0].key).toBe("repo-1");
    expect(cs[0].name).toBe("apim");
    expect(cs[0].points[0].value).toBe(5);
  });
});
