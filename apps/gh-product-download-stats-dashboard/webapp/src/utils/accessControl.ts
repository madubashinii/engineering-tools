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

// Decodes a JWT payload (no signature verification — the backend is the enforcer;
// this is only for UX gating of the Admin panel).
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Extracts the groups claim from a decoded token payload as a string array.
export function extractGroups(payload: Record<string, unknown> | null): string[] {
  if (!payload) return [];
  const groups = payload.groups;
  if (Array.isArray(groups)) {
    return groups.filter((g): g is string => typeof g === "string");
  }
  if (typeof groups === "string" && groups.trim() !== "") {
    return [groups];
  }
  return [];
}

// The admin group names from runtime config (comma-separated).
export function getAdminGroups(): string[] {
  const raw = window.config?.GH_PRODUCT_DOWNLOAD_STATS_DASHBOARD_ADMIN_GROUPS ?? "";
  return raw
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

// True when the user's groups intersect the configured admin groups.
export function userIsAdmin(userGroups: string[], adminGroups: string[]): boolean {
  if (adminGroups.length === 0) return false;
  return userGroups.some((g) => adminGroups.includes(g));
}
