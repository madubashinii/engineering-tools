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

import { dbPool } from "./mysql";

export async function configureBoardLayout(projectId: number, type: 'ITERATION_BASED' | 'FLAT_KANBAN', doneColumnName = 'Done') {
    await dbPool.execute(
        `INSERT INTO project_board_metadata (project_id, layout_type, release_column_name) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE layout_type = ?, release_column_name = ?`,
        [projectId, type, doneColumnName, type, doneColumnName]
    );
    console.log(`Board ${projectId} configured as ${type} (Release Column: ${doneColumnName})`);
}