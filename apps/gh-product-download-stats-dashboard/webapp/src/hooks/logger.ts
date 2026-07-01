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

export interface ILogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface LoggerConfig {
  level: string;
  prefix: string;
}

const LEVELS: Record<string, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  NONE: 99,
};

// Creates a console-backed logger that respects the configured minimum level.
// Sensitive payloads must never be passed in — log only IDs and short summaries.
export function createLogger(config: LoggerConfig): ILogger {
  const threshold = LEVELS[config.level?.toUpperCase()] ?? LEVELS.ERROR;
  const tag = `[${config.prefix}]`;

  const enabled = (level: keyof typeof LEVELS): boolean =>
    LEVELS[level] >= threshold;

  return {
    debug: (...args) => enabled("DEBUG") && console.debug(tag, ...args),
    info: (...args) => enabled("INFO") && console.info(tag, ...args),
    warn: (...args) => enabled("WARN") && console.warn(tag, ...args),
    error: (...args) => enabled("ERROR") && console.error(tag, ...args),
  };
}
