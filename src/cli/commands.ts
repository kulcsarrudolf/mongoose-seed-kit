import mongoose from "mongoose";
import { loadConfig } from "../config";
import * as runner from "../runner";
import {
  MongooseSeederConfig,
  ResolvedMongooseSeederConfig,
  SeederRunResult,
  SeederStatus,
} from "../types";
import { createSeeder } from "./create";

type CliEnv = NodeJS.ProcessEnv;

export function printUsage(): void {
  console.log("Usage:");
  console.log("  mongoose-seed-kit create <name>   Create a new seeder file");
  console.log("  mongoose-seed-kit status          List seeders and statuses");
  console.log(
    "  mongoose-seed-kit run [name]      Run pending seeders or one seeder",
  );
  console.log("  mongoose-seed-kit reset <name>    Mark a seeder as pending");
  console.log("");
  console.log(
    "MongoDB URI: set MONGODB_URI or DATABASE_URL, or configure mongoUri.",
  );
}

function getMongoUri(
  config: Partial<MongooseSeederConfig>,
  env: CliEnv,
): string {
  const uri = env.MONGODB_URI || env.DATABASE_URL || config.mongoUri;
  if (!uri) {
    throw new Error(
      "mongoose-seed-kit: MongoDB URI is required for this command. " +
        "Set MONGODB_URI or DATABASE_URL, or add mongoUri to your config.",
    );
  }
  return uri;
}

async function withConnection<T>(
  env: CliEnv,
  action: (config: ResolvedMongooseSeederConfig) => Promise<T>,
): Promise<T> {
  const config = loadConfig();
  const mongoUri = getMongoUri(config, env);

  await mongoose.connect(mongoUri);
  try {
    return await action(config);
  } finally {
    await mongoose.disconnect();
  }
}

function printStatuses(statuses: SeederStatus[]): void {
  if (statuses.length === 0) {
    console.log("No seeders found.");
    return;
  }

  for (const status of statuses) {
    const executedAt = status.executedAt
      ? ` ${status.executedAt.toISOString()}`
      : "";
    const error = status.error ? ` - ${status.error}` : "";
    console.log(
      `${status.status.padEnd(7)} ${status.name}${executedAt}${error}`,
    );
  }
}

function printRunResults(results: SeederRunResult[]): void {
  if (results.length === 0) {
    console.log("No seeders found.");
    return;
  }

  for (const result of results) {
    const error = result.error ? ` - ${result.error}` : "";
    console.log(`${result.status.padEnd(7)} ${result.name}${error}`);
  }
}

export async function runCli(
  args: string[] = process.argv.slice(2),
  env: CliEnv = process.env,
): Promise<number> {
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return command ? 0 : 1;
  }

  try {
    switch (command) {
      case "create": {
        const name = args[1];
        if (!name) {
          console.error("Error: seeder name is required.");
          console.error("Usage: mongoose-seed-kit create <name>");
          return 1;
        }
        createSeeder(name);
        return 0;
      }

      case "status": {
        await withConnection(env, async (config) => {
          const statuses = await runner.getSeederStatuses(config);
          printStatuses(statuses);
        });
        return 0;
      }

      case "run": {
        let results: SeederRunResult[] = [];
        const name = args[1];
        await withConnection(env, async (config) => {
          results = name
            ? await runner.runSeederByName(name, config)
            : await runner.runPendingSeeders(config);
          printRunResults(results);
        });
        return results.some((result) => result.status === "failed") ? 1 : 0;
      }

      case "reset": {
        const name = args[1];
        if (!name) {
          console.error("Error: seeder name is required.");
          console.error("Usage: mongoose-seed-kit reset <name>");
          return 1;
        }
        await withConnection(env, async (config) => {
          await runner.resetSeeder(name, config);
          console.log(`Reset: ${name}`);
        });
        return 0;
      }

      default:
        console.error(`Unknown command: "${command}"`);
        printUsage();
        return 1;
    }
  } catch (err: any) {
    console.error(err?.message || String(err));
    return 1;
  }
}
