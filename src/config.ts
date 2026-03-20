import fs from "fs";
import path from "path";
import { MongooseSeederConfig } from "./types";

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

export function loadConfig(
  overrides?: Partial<MongooseSeederConfig>,
): MongooseSeederConfig {
  const cwd = process.cwd();
  const fileConfig = loadConfigFromFile(cwd);

  const merged = { ...fileConfig, ...overrides };

  if (!merged.seedersPath) {
    throw new Error(
      'mongoose-seed-kit: "seedersPath" is required. ' +
        "Provide it via mongoose-seed-kit.config.js, package.json, or inline config.",
    );
  }

  const seedersPath = path.isAbsolute(merged.seedersPath)
    ? merged.seedersPath
    : path.resolve(cwd, merged.seedersPath);

  return {
    seedersPath,
    collectionName: merged.collectionName ?? DEFAULT_COLLECTION_NAME,
    filePattern: merged.filePattern ?? DEFAULT_FILE_PATTERN,
  };
}
