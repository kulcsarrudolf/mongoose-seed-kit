/**
 * `seedersPath` may be a static string or a function evaluated lazily when a
 * runner is invoked. The function form lets consumers choose between a `src/`
 * tree (loaded by tsx/ts-node in development) and a `dist/` tree (loaded by
 * `node dist/...` in production) so that seeders share the same module graph
 * as the rest of the app and don't trigger duplicate-model errors in Mongoose.
 */
export type SeedersPathResolver = () => string;

export interface MongooseSeederConfig {
  seedersPath: string | SeedersPathResolver;
  collectionName?: string;
  filePattern?: RegExp;
}

/** Internal shape after `loadConfig` has resolved any function form. */
export interface ResolvedMongooseSeederConfig {
  seedersPath: string;
  collectionName: string;
  filePattern: RegExp;
}

export interface SeederRunResult {
  name: string;
  status: "success" | "failed" | "skipped";
  error?: string;
}

export interface SeederStatus {
  name: string;
  status: "success" | "failed" | "pending";
  executedAt: Date | null;
  error: string | null;
}

export interface SeederRecord {
  name: string;
  executedAt: Date;
  status: "success" | "failed";
  error?: string;
}
