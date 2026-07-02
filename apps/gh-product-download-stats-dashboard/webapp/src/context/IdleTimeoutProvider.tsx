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

import { useIdleTimer } from "react-idle-timer";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { useAsgardeo } from "@asgardeo/react";
import SessionWarningDialog from "@components/session-warning/SessionWarningDialog";
import {
  IDLE_TIMEOUT_MS,
  IDLE_THROTTLE_MS,
  IDLE_WARNING_GRACE_MS,
} from "@constants/authConstants";
import { useLogger } from "@hooks/useLogger";

interface IdleTimeoutProviderProps {
  children: ReactNode;
}

/**
 * Shows "Are you still there?" after 10 minutes of inactivity. If the user
 * doesn't click Continue within IDLE_WARNING_GRACE_MS, the session is
 * force-logged-out — an unattended authenticated session can't be resumed forever.
 */
export default function IdleTimeoutProvider({
  children,
}: IdleTimeoutProviderProps): JSX.Element {
  const [warningOpen, setWarningOpen] = useState(false);
  const { signOut, isSignedIn, isLoading } = useAsgardeo();
  const logger = useLogger();
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGraceTimer = useCallback(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearGraceTimer();
    window.dispatchEvent(new CustomEvent("app:signing-out"));
    try {
      await signOut();
      setWarningOpen(false);
    } catch {
      logger.error("Error signing out after idle timeout");
      setWarningOpen(true);
    }
  }, [signOut, logger, clearGraceTimer]);

  const { activate } = useIdleTimer({
    timeout: IDLE_TIMEOUT_MS,
    throttle: IDLE_THROTTLE_MS,
    onIdle: () => {
      if (isSignedIn && !isLoading) {
        setWarningOpen(true);
        clearGraceTimer();
        graceTimerRef.current = setTimeout(() => {
          void handleLogout();
        }, IDLE_WARNING_GRACE_MS);
      }
    },
  });

  const handleContinue = () => {
    clearGraceTimer();
    setWarningOpen(false);
    activate();
  };

  // Belt-and-braces: cancel a pending forced logout if the provider unmounts.
  useEffect(() => clearGraceTimer, [clearGraceTimer]);

  return (
    <>
      <SessionWarningDialog
        open={warningOpen}
        onContinue={handleContinue}
        onLogout={() => void handleLogout()}
      />
      {children}
    </>
  );
}
