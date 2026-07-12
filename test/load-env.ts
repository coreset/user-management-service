import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

/**
 * Loads `.env.test` BEFORE the Nest app (and its ConfigModule) is imported, so
 * e2e tests connect to the dedicated test database — never the dev/prod DB.
 * Referenced from test/jest-e2e.json `setupFiles`, which run before each test
 * file's own imports. `override: true` ensures test values beat any DB_* vars
 * already exported in the shell.
 */
dotenvConfig({ path: join(__dirname, '../.env.test'), override: true });
