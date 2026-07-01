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

// These records mirror the Engineering Entity REST service responses (camelCase).
// They are open records so unused fields in the response are simply ignored.

# [Configurable] OAuth2 entity application configuration.
#
# + tokenUrl - OAuth2 token endpoint
# + clientId - OAuth2 client ID
# + clientSecret - OAuth2 client secret
type Oauth2Config record {|
    string tokenUrl;
    string clientId;
    string clientSecret;
|};

# Retry config for the entity HTTP client.
#
# + count - Retry count
# + interval - Retry interval
# + backOffFactor - Retry backOff factor
# + maxWaitInterval - Retry max interval
public type HttpRetryConfig record {|
    int count = RETRY_COUNT;
    decimal interval = RETRY_INTERVAL;
    float backOffFactor = RETRY_BACKOFF_FACTOR;
    decimal maxWaitInterval = RETRY_MAX_INTERVAL;
|};

# Repository response from the Entity Service.
#
# + id - Repository unique ID
# + name - Repository name
# + forksCount - Number of forks
# + stargazersCount - Number of stargazers
# + watchersCount - Number of watchers
# + openIssuesCount - Number of open issues
public type Repository record {
    int id?;
    string name;
    int forksCount?;
    int stargazersCount?;
    int watchersCount?;
    int openIssuesCount?;
};

# A release asset from the Entity Service.
#
# + id - Asset unique ID
# + name - Asset file name
# + contentType - MIME type
# + size - File size in bytes
# + downloadCount - Number of downloads
public type Asset record {
    int id;
    string name;
    string? contentType;
    int size;
    int downloadCount;
};

# A release from the Entity Service.
#
# + id - Release unique ID
# + tagName - Git tag name
# + name - Release title (may be null)
# + preRelease - Whether this is a pre-release
# + assets - Attached release assets
public type Release record {
    int id;
    string tagName;
    string? name;
    boolean preRelease;
    Asset[] assets;
};

# A single day's clone traffic record from the Entity Service.
#
# + timestamp - Day timestamp (ISO 8601, midnight UTC)
# + count - Total clones on that day
# + uniques - Unique cloners on that day
public type CloneRecord record {
    string timestamp;
    int count;
    int uniques;
};

# Clone traffic response from the Entity Service.
#
# + count - Total clones over the period (14-day rolling total)
# + uniques - Unique cloners over the period (14-day rolling total)
# + clones - Per-day breakdown
public type ClonesTraffic record {
    int count;
    int uniques;
    CloneRecord[] clones;
};
