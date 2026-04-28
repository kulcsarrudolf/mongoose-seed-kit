import fs from "fs";
import path from "path";
import {
  MongooseSeederConfig,
  ResolvedMongooseSeederConfig,
  SeedersPathResolver,
} from "./types";

const DEFAULT_COLLECTION_NAME = "seeders";
const DEFAULT_FILE_PATTERN = /^\d{14}-.+\.seeder\.(ts|js)$/;

const CONFIG_FILES = [
  "mongoose-seed-kit.config.js",
  "mongoose-seed-kit.config.json",
];

function loadConfigFromFile(cwd: string): Partial<MongooseSeederConfig> | null {
  for (const filename of CONFIG_FILES) {
    const filepath = path.resolve(cwd, filename);
    if (fs.existsSync(filepath)) {
      const loaded = require(filepath);
      return loaded.default || loaded;
    }
  }

  const pkgPath = path.resolve(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (pkg["mongoose-seed-kit"]) {
      return pkg["mongoose-seed-kit"];
    }
  }

  return null;
}

function isResolver(
  value: string | SeedersPathResolver | undefined,
): value is SeedersPathResolver {
  return typeof value === "function";
}

export function loadConfig(
  overrides?: Partial<MongooseSeederConfig>,
): ResolvedMongooseSeederConfig {
  const cwd = process.cwd();
  const fileConfig = loadConfigFromFile(cwd);

  const merged = { ...fileConfig, ...overrides };

  if (!merged.seedersPath) {
    throw new Error(
      'mongoose-seed-kit: "seedersPath" is required. ' +
        "Provide it via mongoose-seed-kit.config.js, package.json, or inline config.",
    );
  }

  const rawPath = isResolver(merged.seedersPath)
    ? merged.seedersPath()
    : merged.seedersPath;

  if (typeof rawPath !== "string" || rawPath.length === 0) {
    throw new Error(
      'mongoose-seed-kit: "seedersPath" must resolve to a non-empty string.',
    );
  }

  const seedersPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(cwd, rawPath);

  return {
    seedersPath,
    collectionName: merged.collectionName ?? DEFAULT_COLLECTION_NAME,
    filePattern: merged.filePattern ?? DEFAULT_FILE_PATTERN,
    mongoUri: merged.mongoUri,
  };
}

/**
 * Pick between a `src/` and `dist/` seeders directory based on the current
 * runtime. Detection order:
 *
 * 1. If `srcWhen` returns `true`, use `src`.
 * 2. Otherwise, if the **caller's** module path lives inside a `dist`
 *    directory (e.g. `…/dist/index.js`), use `dist`. This typically means the
 *    app is running compiled JS via `node dist/...`.
 * 3. Otherwise, if the entrypoint script ends with `.ts`/`.tsx` or is loaded
 *    via `tsx`/`ts-node`, use `src`.
 * 4. Fall back to `dist`.
 *
 * The goal is to keep the seeders in the same module graph as the rest of the
 * app so Mongoose models registered by the app are reused inside seeders.
 *
 * @example
 * // mongoose-seed-kit.config.js
 * const path = require("path");
 * const { resolveSeedersPath } = require("mongoose-seed-kit");
 *
 * module.exports = {
 *   seedersPath: resolveSeedersPath({
 *     src: path.join(__dirname, "src/db/seeders"),
 *     dist: path.join(__dirname, "dist/db/seeders"),
 *   }),
 * };
 */
export function resolveSeedersPath(opts: {
  src: string;
  dist: string;
  /** Optional override (e.g. read NODE_ENV). Returning `true` forces `src`. */
  srcWhen?: () => boolean;
}): SeedersPathResolver {
  return () => {
    if (opts.srcWhen && opts.srcWhen()) return opts.src;

    const callerFile = (require.main && require.main.filename) || "";
    const argvFile = process.argv[1] || "";
    const looksCompiled =
      /[\\/]dist[\\/]/.test(callerFile) || /[\\/]dist[\\/]/.test(argvFile);
    if (looksCompiled) return opts.dist;

    const isTsRuntime =
      /\.(ts|tsx)$/.test(argvFile) ||
      Boolean(
        (
          process as unknown as { _preload_modules?: string[] }
        )._preload_modules?.some((m) => /tsx|ts-node/.test(m)),
      ) ||
      Boolean(process.env.TS_NODE_DEV) ||
      Boolean(process.env.TSX);
    return isTsRuntime ? opts.src : opts.dist;
  };
}
