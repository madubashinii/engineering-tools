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

import { Header as HeaderUI } from "@wso2/oxygen-ui";
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import { APP_NAME } from "@constants/common";

// WSO2 logo + app title in the header. The logo swaps with the active color
// scheme (dark uses the white logo) by observing the data-color-scheme attribute
// Oxygen sets on <html>.
export default function Brand(): JSX.Element {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(
    () => document.documentElement.getAttribute("data-color-scheme") === "dark",
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(
        document.documentElement.getAttribute("data-color-scheme") === "dark",
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-scheme"],
    });
    return () => observer.disconnect();
  }, []);

  const logoSrc = isDark ? "/logo-white.svg" : "/logo-dark.svg";

  return (
    <HeaderUI.Brand onClick={() => navigate("/")} sx={{ cursor: "pointer" }}>
      <HeaderUI.BrandLogo>
        <img
          key={logoSrc}
          src={logoSrc}
          alt="WSO2"
          style={{ height: "24px", width: "auto" }}
        />
      </HeaderUI.BrandLogo>
      <HeaderUI.BrandTitle>{APP_NAME}</HeaderUI.BrandTitle>
    </HeaderUI.Brand>
  );
}
