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

import { AppShell, Box, useAppShell } from "@wso2/oxygen-ui";
import { type JSX, Suspense } from "react";
import { Outlet } from "react-router";
import { useAsgardeo } from "@asgardeo/react";
import Header from "@components/header/Header";
import SideBar from "@components/side-nav-bar/SideBar";
import PageSkeleton from "@components/skeleton/PageSkeleton";
import IdleTimeoutProvider from "@context/IdleTimeoutProvider";

// Main authenticated shell: top navbar, collapsible sidebar, and routed content.
// Loading is skeleton-based (no progress lines): a PageSkeleton covers auth
// initialisation and lazy route-chunk loads, while each card/chart/table renders
// its own skeleton during data fetch — keeping transitions smooth.
export default function AppLayout(): JSX.Element {
  const { state, actions } = useAppShell({ initialCollapsed: false });
  const { isLoading: isAuthLoading } = useAsgardeo();

  return (
    <IdleTimeoutProvider>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          overflow: "hidden",
        }}
      >
        <AppShell sx={{ flex: 1, minHeight: 0 }}>
          <AppShell.Navbar>
            <Header
              onToggleSidebar={actions.toggleSidebar}
              collapsed={state.sidebarCollapsed}
            />
          </AppShell.Navbar>

          <AppShell.Sidebar>
            <SideBar collapsed={state.sidebarCollapsed} />
          </AppShell.Sidebar>

          <AppShell.Main>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                p: 3,
              }}
            >
              {isAuthLoading ? (
                <PageSkeleton />
              ) : (
                <Suspense fallback={<PageSkeleton />}>
                  <Outlet />
                </Suspense>
              )}
            </Box>
          </AppShell.Main>
        </AppShell>
      </Box>
    </IdleTimeoutProvider>
  );
}
