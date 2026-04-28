import fs from "fs";
import path from "path";
import { loadConfig } from "./config";
import {
  ensureIndexes,
  getExecutedSeeders,
  getAllTrackedSeeders,
  upsertSeederRecord,
  deleteSeederRecord,
} from "./tracker";
import {
  MongooseSeederConfig,
  ResolvedMongooseSeederConfig,
  SeederRunResult,
  SeederStatus,
  SeederRecord,
} from "./types";

type SeederFn = () => Promise<void>;

function getSeederFiles(config: ResolvedMongooseSeederConfig): string[] {
  if (!fs.existsSync(config.seedersPath)) {
    return [];
  }
  return fs
    .readdirSync(config.seedersPath)
    .filter((f) => config.filePattern.test(f))
    .sort();
}

async function runSingleSeeder(
  name: string,
  filepath: string,
  collectionName: string,
  results: SeederRunResult[],
): Promise<void> {
  try {
    const seederModule = require(filepath);
    const seederFn: SeederFn = seederModule.default || seederModule;

    if (typeof seederFn !== "function") {
      throw new Error(`Seeder "${name}" does not export a function`);
    }

    await seederFn();

    await upsertSeederRecord(collectionName, {
      name,
      executedAt: new Date(),
      status: "success",
    });

    results.push({ name, status: "success" });
    console.log(`[mongoose-seed-kit] "${name}" ran successfully`);
  } catch (err: any) {
    const errorMessage = err?.message || String(err);

    await upsertSeederRecord(collectionName, {
      name,
      executedAt: new Date(),
      status: "failed",
      error: errorMessage,
    });

    results.push({ name, status: "failed", error: errorMessage });
    console.error(`[mongoose-seed-kit] "${name}" failed: ${errorMessage}`);
  }
}

export async function runPendingSeeders(
  overrides?: Partial<MongooseSeederConfig>,
): Promise<SeederRunResult[]> {
  const config = loadConfig(overrides);
  await ensureIndexes(config.collectionName);

  const files = getSeederFiles(config);
  const executed = await getExecutedSeeders(config.collectionName);
  const executedNames = new Set(executed.map((s) => s.name));

  const results: SeederRunResult[] = [];

  for (const file of files) {
    const name = path.basename(file, path.extname(file));

    if (executedNames.has(name)) {
      results.push({ name, status: "skipped" });
      continue;
    }

    const filepath = path.join(config.seedersPath, file);
    await runSingleSeeder(name, filepath, config.collectionName, results);
  }

  return results;
}

export async function runSeederByName(
  seederName: string,
  overrides?: Partial<MongooseSeederConfig>,
): Promise<SeederRunResult[]> {
  const config = loadConfig(overrides);
  await ensureIndexes(config.collectionName);

  const files = getSeederFiles(config);
  const file = files.find(
    (f) => path.basename(f, path.extname(f)) === seederName,
  );

  if (!file) {
    throw new Error(`Seeder "${seederName}" not found`);
  }

  const results: SeederRunResult[] = [];
  const filepath = path.join(config.seedersPath, file);
  await runSingleSeeder(seederName, filepath, config.collectionName, results);
  return results;
}

export async function getSeederStatuses(
  overrides?: Partial<MongooseSeederConfig>,
): Promise<SeederStatus[]> {
  const config = loadConfig(overrides);
  await ensureIndexes(config.collectionName);

  const files = getSeederFiles(config);
  const tracked = await getAllTrackedSeeders(config.collectionName);
  const trackedMap = new Map<string, SeederRecord>(
    tracked.map((s) => [s.name, s]),
  );

  return files.map((f) => {
    const name = path.basename(f, path.extname(f));
    const record = trackedMap.get(name);
    return {
      name,
      status: (record?.status ?? "pending") as
        | "success"
        | "failed"
        | "pending",
      executedAt: record?.executedAt ?? null,
      error: record?.error ?? null,
    };
  });
}

export async function resetSeeder(
  seederName: string,
  overrides?: Partial<MongooseSeederConfig>,
): Promise<void> {
  const config = loadConfig(overrides);
  await deleteSeederRecord(config.collectionName, seederName);
}
