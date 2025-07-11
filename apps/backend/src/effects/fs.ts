import fs from 'fs/promises';
import { Effect } from 'effect';

export const createDir = (dirPath: string) => {
  return Effect.promise(async () => {
    try {
      await fs.stat(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }).pipe(
    Effect.catchAll((error: Error) =>
      Effect.fail(new Error(`Failed to create directory: ${error.message}`))
    )
  );
};
