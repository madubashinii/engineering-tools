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
  extractGroups,
  userIsAdmin,
  decodeJwtPayload,
} from "@utils/accessControl";

describe("accessControl", () => {
  it("extractGroups handles array, string, and missing claims", () => {
    expect(extractGroups({ groups: ["a", "b"] })).toEqual(["a", "b"]);
    expect(extractGroups({ groups: "a" })).toEqual(["a"]);
    expect(extractGroups({})).toEqual([]);
    expect(extractGroups(null)).toEqual([]);
  });

  it("userIsAdmin requires intersection with non-empty admin groups", () => {
    expect(userIsAdmin(["x", "gh-stats-admins"], ["gh-stats-admins"])).toBe(true);
    expect(userIsAdmin(["x"], ["gh-stats-admins"])).toBe(false);
    expect(userIsAdmin(["gh-stats-admins"], [])).toBe(false);
  });

  it("decodeJwtPayload returns the payload claims", () => {
    // header.payload.signature with payload {"groups":["gh-stats-admins"],"email":"a@b.com"}
    const payload = btoa(
      JSON.stringify({ groups: ["gh-stats-admins"], email: "a@b.com" }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const token = `header.${payload}.sig`;
    const decoded = decodeJwtPayload(token);
    expect(extractGroups(decoded)).toEqual(["gh-stats-admins"]);
  });

  it("decodeJwtPayload returns null for malformed tokens", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });
});
