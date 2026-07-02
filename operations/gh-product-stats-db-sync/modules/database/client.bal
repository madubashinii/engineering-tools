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
import ballerinax/mysql;
import ballerinax/mysql.driver as _;

# Database client configuration.
configurable DatabaseConfig databaseConfig = ?;

# Connection timeout to the database in seconds.
configurable decimal connectTimeout = ?;

DatabaseClientConfig databaseClientConfig = {
    ...databaseConfig,
    options: {
        ssl: {
            mode: mysql:SSL_REQUIRED
        },
        connectTimeout: connectTimeout
    }
};

# Initialize the Github Stats database client.
#
# + return - The MySQL client or an error
function initGithubDbClient() returns mysql:Client|error
=> new (...databaseClientConfig);

# Github Stats database client.
final mysql:Client databaseClient = check initGithubDbClient();
