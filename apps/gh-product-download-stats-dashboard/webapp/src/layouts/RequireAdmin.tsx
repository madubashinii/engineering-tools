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

import { type JSX, type ReactNode } from "react";
import { Navigate } from "react-router";
import { useIsAdmin } from "@hooks/useIsAdmin";
import { ROUTES } from "@constants/common";
import PageSkeleton from "@components/skeleton/PageSkeleton";

interface RequireAdminProps {
  children: ReactNode;
}

// Route guard for admin-only pages. UX gating only — the backend enforces 403.
export default function RequireAdmin({ children }: RequireAdminProps): JSX.Element {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return <PageSkeleton />;
  }
  if (!isAdmin) {
    return <Navigate to={ROUTES.ERROR_403} replace />;
  }
  return <>{children}</>;
}
