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

/**
 * Returns a loading flag that stays true for at least `minMs` milliseconds
 * after `isPending` first becomes true, even if the underlying operation
 * completes faster.
 */
export function useMinLoading(isPending: boolean, minMs = 1000): boolean {
  const [loading, setLoading] = useState(false);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPending) {
      if (timerRef.current) clearTimeout(timerRef.current);
      startRef.current = Date.now();
      setLoading(true);
    } else if (startRef.current !== null) {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, minMs - elapsed);
      timerRef.current = setTimeout(() => {
        setLoading(false);
        startRef.current = null;
      }, remaining);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPending, minMs]);

  return loading;
}
