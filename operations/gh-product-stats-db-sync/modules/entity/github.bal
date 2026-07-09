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
import ballerina/log;

# Fetch repository stats. The Entity Service identity model uses orgName == owner == the GitHub org.
#
# + orgName - GitHub org name (used for both the orgName and owner path segments)
# + repoName - Repository name
# + return - Repository stats, or an error
public isolated function getRepository(string orgName, string repoName) returns Repository|error {
    return entityClient->/orgs/[orgName]/repos/[orgName]/[repoName];
}

# Fetch all releases for a repository, paginating until a short page is returned.
# No prerelease filter is sent, so the Entity Service returns all releases.
# Stops early (logging a warning) after MAX_RELEASE_PAGES, so a misbehaving
# upstream that never returns a short page can't wedge the cron in an infinite loop.
#
# + orgName - GitHub org name
# + repoName - Repository name
# + return - All releases (possibly truncated at MAX_RELEASE_PAGES), or an error
public isolated function getAllReleases(string orgName, string repoName) returns Release[]|error {
    Release[] allReleases = [];
    int page = 1;
    while true {
        Release[] batch = check entityClient->/orgs/[orgName]/repos/[orgName]/[repoName]/releases(
            perPage = RELEASES_PAGE_SIZE, page = page
        );
        allReleases.push(...batch);
        if batch.length() < RELEASES_PAGE_SIZE {
            break;
        }
        if page >= MAX_RELEASE_PAGES {
            log:printWarn("getAllReleases: hit MAX_RELEASE_PAGES; stopping pagination early",
                orgName = orgName, repoName = repoName, page = page, releasesFetched = allReleases.length());
            break;
        }
        page += 1;
    }
    return allReleases;
}

# Fetch clone traffic (last 14 days) for a repository.
#
# + orgName - GitHub org name
# + repoName - Repository name
# + return - Clone traffic, or an error
public isolated function getClonesTraffic(string orgName, string repoName) returns ClonesTraffic|error {
    return entityClient->/orgs/[orgName]/repos/[orgName]/[repoName]/traffic/clones;
}
