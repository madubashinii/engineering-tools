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

// Shape of the OIDC ID token claims the profile UI relies on.
export interface IdTokenClaims {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  preferred_username?: string;
  username?: string;
  // `picture` is the canonical OIDC avatar field; some IdPs (Asgardeo, Google)
  // put the avatar URL in `profile` instead — read both.
  profile?: string;
  picture?: string;
}

export interface ResolvedUserInfo {
  fullName: string;
  email: string;
  avatarUrl?: string;
}

// Maps raw ID token claims to the display fields used by the header profile
// menu, degrading gracefully when optional claims (name, picture) are absent.
export function resolveUserInfo(user: unknown): ResolvedUserInfo {
  const c = (user ?? {}) as IdTokenClaims;
  const fullName =
    c.name ||
    [c.given_name, c.family_name].filter(Boolean).join(" ").trim() ||
    c.preferred_username ||
    c.username ||
    c.email ||
    "Signed in";

  return {
    fullName,
    email: c.email ?? "",
    avatarUrl: c.picture || c.profile,
  };
}
