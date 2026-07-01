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

import { Box, Link, Sidebar, Typography } from "@wso2/oxygen-ui";
import { type JSX } from "react";
import { useLocation, Link as NavigateLink } from "react-router";
import { NAV_ITEMS, type NavItem } from "@components/side-nav-bar/navItems";
import { useIsAdmin } from "@hooks/useIsAdmin";
import { ROUTES } from "@constants/common";

const COMPANY_NAME = "WSO2 LLC";
const TERMS_URL = "https://wso2.com/terms-of-use/";
const PRIVACY_URL = "https://wso2.com/privacy-policy/";

interface SideBarProps {
  collapsed: boolean;
}

// Resolves the active nav id from the current path. Overview ("/") matches exactly;
// other items match by path prefix.
function resolveActiveItem(pathname: string, items: NavItem[]): string {
  const match = items.find((item) =>
    item.path === ROUTES.OVERVIEW
      ? pathname === ROUTES.OVERVIEW
      : pathname.startsWith(item.path),
  );
  return match?.id ?? "overview";
}

export default function SideBar({ collapsed }: SideBarProps): JSX.Element {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const activeItem = resolveActiveItem(location.pathname, items);

  return (
    <Sidebar collapsed={collapsed} activeItem={activeItem}>
      <Sidebar.Nav>
        <Sidebar.Category>
          {items.map((item) => (
            <Link
              key={item.id}
              component={NavigateLink}
              to={item.path}
              color="primary"
              underline="none"
            >
              <Sidebar.Item id={item.id}>
                <Sidebar.ItemIcon>
                  <item.icon size={20} />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>{item.label}</Sidebar.ItemLabel>
              </Sidebar.Item>
            </Link>
          ))}
        </Sidebar.Category>
      </Sidebar.Nav>

      {/* Legal footer at the bottom of the rail (hidden when collapsed — the
          text won't fit the narrow rail). */}
      {!collapsed && (
        <Sidebar.Footer showDivider>
          <Box
            sx={{ px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
            </Typography>
            <Box
              sx={{ display: "flex", flexWrap: "wrap", columnGap: 1.5, rowGap: 0.25 }}
            >
              <Link
                href={TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                color="text.secondary"
                underline="hover"
              >
                Terms & Conditions
              </Link>
              <Link
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                color="text.secondary"
                underline="hover"
              >
                Privacy Policy
              </Link>
            </Box>
          </Box>
        </Sidebar.Footer>
      )}
    </Sidebar>
  );
}
