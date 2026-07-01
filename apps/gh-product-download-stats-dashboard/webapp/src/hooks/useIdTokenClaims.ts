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

import { useEffect, useRef, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { decodeJwtPayload } from "@utils/accessControl";
import { type IdTokenClaims } from "@utils/userClaims";

// Decodes the Asgardeo ID token payload once the user is signed in. The token is
// already in storage, so this avoids the extra SCIM call that enabling
// `fetchUserProfile` would trigger. getIdToken is captured via a ref because the
// SDK doesn't guarantee referential stability of the callback.
export function useIdTokenClaims(): IdTokenClaims | undefined {
  const { getIdToken, isSignedIn } = useAsgardeo();
  const getIdTokenRef = useRef(getIdToken);
  useEffect(() => {
    getIdTokenRef.current = getIdToken;
  }, [getIdToken]);

  const [claims, setClaims] = useState<IdTokenClaims | undefined>(undefined);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await getIdTokenRef.current();
        if (!cancelled) {
          setClaims((decodeJwtPayload(token ?? "") ?? undefined) as IdTokenClaims | undefined);
        }
      } catch {
        if (!cancelled) setClaims(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  return claims;
}
