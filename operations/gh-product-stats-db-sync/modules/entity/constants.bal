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

# Client retry configuration for max retry attempts.
public const int RETRY_COUNT = 3;

# Client retry configuration for wait interval in seconds.
public const decimal RETRY_INTERVAL = 3.0;

# Client retry configuration for interval increment in seconds.
public const float RETRY_BACKOFF_FACTOR = 2.0;

# Client retry configuration for maximum wait interval in seconds.
public const decimal RETRY_MAX_INTERVAL = 20.0;

# Number of releases requested per page from the Entity Service.
public const int RELEASES_PAGE_SIZE = 100;

# Safety ceiling on release pages fetched per repository (50 pages x 100/page =
# 5000 releases — far beyond any real repo's release count). Guards against an
# unbounded loop if the Entity Service ever misbehaves (e.g. always returns a
# full page regardless of the page param).
public const int MAX_RELEASE_PAGES = 50;
