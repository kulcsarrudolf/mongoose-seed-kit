import path from "path";
import { expect } from "chai";
import mongoose from "mongoose";
import {
  runPendingSeeders,
  runSeederByName,
  getSeederStatuses,
  resetSeeder,
} from "../src/runner";
import { MongooseSeederConfig } from "../src/types";

// Resolve from project root — .js fixtures aren't copied by tsc
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const FIXTURES_DIR = path.join(PROJECT_ROOT, "tests", "helpers", "fixtures");


const config: Partial<MongooseSeederConfig> = {
  seedersPath: FIXTURES_DIR,
  collectionName: "seeders",
};

describe("runner", function () {
  afterEach(async function () {
    const db = mongoose.connection.db;
    if (db) {
      await db.collection("test_data").deleteMany({});
    }
  });

  describe("runPendingSeeders", function () {
    it("should run all pending seeders", async function () {
      const results = await runPendingSeeders(config);
      expect(results).to.have.lengthOf(3);
      expect(results[0].name).to.equal("20260101120000-test-success.seeder");
      expect(results[0].status).to.equal("success");
      expect(results[1].name).to.equal("20260101120001-test-fail.seeder");
      expect(results[1].status).to.equal("failed");
      expect(results[2].name).to.equal(
        "20260101120002-test-second-success.seeder",
      );
      expect(results[2].status).to.equal("success");
    });

    it("should skip already executed seeders", async function () {
      await runPendingSeeders(config);
      const results = await runPendingSeeders(config);
      const successful = results.filter((r) => r.status === "skipped");
      // The two successful seeders should be skipped, the failed one should retry
      expect(successful).to.have.lengthOf(2);
      const failed = results.find((r) => r.status === "failed");
      expect(failed).to.exist;
    });

    it("should record results in the database", async function () {
      await runPendingSeeders(config);
      const db = mongoose.connection.db!;
      const records = await db.collection("seeders").find({}).toArray();
      expect(records).to.have.lengthOf(3);
    });

    it("should execute seeders in sorted order", async function () {
      const results = await runPendingSeeders(config);
      const names = results.map((r) => r.name);
      const sorted = [...names].sort();
      expect(names).to.deep.equal(sorted);
    });
  });

  describe("runSeederByName", function () {
    it("should force-run a specific seeder", async function () {
      await runPendingSeeders(config);
      const results = await runSeederByName(
        "20260101120000-test-success.seeder",
        config,
      );
      expect(results).to.have.lengthOf(1);
      expect(results[0].status).to.equal("success");
    });

    it("should throw if seeder not found", async function () {
      try {
        await runSeederByName("nonexistent-seeder", config);
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).to.include("not found");
      }
    });
  });

  describe("getSeederStatuses", function () {
    it("should return pending status for unexecuted seeders", async function () {
      const statuses = await getSeederStatuses(config);
      expect(statuses).to.have.lengthOf(3);
      statuses.forEach((s) => {
        expect(s.status).to.equal("pending");
        expect(s.executedAt).to.be.null;
      });
    });

    it("should return correct statuses after execution", async function () {
      await runPendingSeeders(config);
      const statuses = await getSeederStatuses(config);
      const success = statuses.filter((s) => s.status === "success");
      const failed = statuses.filter((s) => s.status === "failed");
      expect(success).to.have.lengthOf(2);
      expect(failed).to.have.lengthOf(1);
      expect(failed[0].error).to.include("Intentional seeder failure");
    });
  });

  describe("resetSeeder", function () {
    it("should allow a seeder to re-run after reset", async function () {
      await runPendingSeeders(config);
      await resetSeeder("20260101120000-test-success.seeder", config);

      const statuses = await getSeederStatuses(config);
      const reset = statuses.find(
        (s) => s.name === "20260101120000-test-success.seeder",
      );
      expect(reset!.status).to.equal("pending");

      const results = await runPendingSeeders(config);
      const reran = results.find(
        (r) => r.name === "20260101120000-test-success.seeder",
      );
      expect(reran!.status).to.equal("success");
    });
  });
});
