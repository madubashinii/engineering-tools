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

import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import {
  decodeJwtPayload,
  extractGroups,
  getAdminGroups,
  userIsAdmin,
} from "@utils/accessControl";

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

// Resolves whether the signed-in user belongs to a configured admin group by
// decoding the Asgardeo ID token's `groups` claim. UX gating only — the backend
// enforces admin access on every /admin endpoint.
export function useIsAdmin(): AdminState {
  const { getIdToken, isSignedIn, isLoading: isAuthLoading } = useAsgardeo();
  const [groups, setGroups] = useState<string[] | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let active = true;
    getIdToken()
      .then((token) => {
        if (active) setGroups(extractGroups(decodeJwtPayload(token ?? "")));
      })
      .catch(() => {
        if (active) setGroups([]);
      });
    return () => {
      active = false;
    };
  }, [isSignedIn, getIdToken]);

  // When not signed in, the user has no groups (no synchronous setState needed).
  const resolvedGroups = isSignedIn ? groups : [];
  return {
    isAdmin:
      resolvedGroups !== null && userIsAdmin(resolvedGroups, getAdminGroups()),
    isLoading: isAuthLoading || (isSignedIn && groups === null),
  };
}
