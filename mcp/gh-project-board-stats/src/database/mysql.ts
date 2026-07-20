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

import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'github_stats_db'
};

export let dbPool: mysql.Pool;

export async function initializeDatabase() {
  if (process.env.RUN_MIGRATIONS === 'true') {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await connection.end();
  }

  dbPool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  if (process.env.RUN_MIGRATIONS === 'true') {
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        github_id VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        encrypted_access_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (github_id),
        UNIQUE KEY uk_email (email)
      );
    `);

    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS user_project_preferences (
        github_id VARCHAR(100) NOT NULL,
        project_id INT NOT NULL,
        organization_name VARCHAR(100) NOT NULL,
        board_name VARCHAR(150) NOT NULL,
        is_remembered TINYINT(1) DEFAULT 0,
        PRIMARY KEY (github_id, project_id)
      );
    `);

    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS project_board_metadata (
        project_id INT PRIMARY KEY,
        layout_type ENUM('ITERATION_BASED', 'FLAT_KANBAN') DEFAULT 'ITERATION_BASED',
        release_column_name VARCHAR(100) DEFAULT 'Done'
      );
    `);

    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS user_session_state (
        github_id VARCHAR(100) PRIMARY KEY,
        current_state VARCHAR(50) NOT NULL,
        pending_board_name VARCHAR(150),
        pending_iteration VARCHAR(50),
        pending_function VARCHAR(100)
      );
    `);

    try {
      const [columns]: any = await dbPool.execute(
        "SHOW COLUMNS FROM user_project_preferences LIKE 'user_id'"
      );

      if (columns.length > 0) {
        console.log("Legacy 'user_id' schema context detected. Migrating tracking preference table layout structures...");

        // Migration: Drop the old primary key and change the column name to 'github_id'
        await dbPool.execute("ALTER TABLE user_project_preferences DROP PRIMARY KEY");
        await dbPool.execute("ALTER TABLE user_project_preferences CHANGE COLUMN user_id github_id VARCHAR(100) NOT NULL");
        await dbPool.execute("ALTER TABLE user_project_preferences ADD PRIMARY KEY (github_id, project_id)");

        console.log("Table structures for 'user_project_preferences' patched successfully.");
      }
    } catch (migrationErr) {
      console.error("Warning: Optional database structural migration engine threw a structural state check exception: ", migrationErr);
    }

    console.log("Database structural tables checked/initialized.");
  }

  console.log(`Database connection pool initialized successfully for database: ${dbConfig.database}`);
}