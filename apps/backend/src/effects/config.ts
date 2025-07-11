import fs from 'fs';
import yaml from 'yaml';
import { ContractsData } from '../types';

import { Effect } from 'effect';

export const readConfig = (configPath: string) =>
  Effect.gen(function* () {
    const file = yield* Effect.sync(() => fs.readFileSync(configPath, 'utf8'));
    const output = yield* Effect.sync(() => yaml.parse(file) as ContractsData);
    return output;
  }).pipe(
    Effect.catchAll((error: Error) =>
      Effect.fail(new Error(`Failed to read config: ${error.message}`))
    )
  );
