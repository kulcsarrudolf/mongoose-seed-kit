import { expect } from "chai";
import {
  ensureIndexes,
  getExecutedSeeders,
  getAllTrackedSeeders,
  upsertSeederRecord,
  deleteSeederRecord,
} from "../src/tracker";

const COLLECTION = "seeders";

describe("tracker", function () {
  describe("ensureIndexes", function () {
    it("should create a unique index on name", async function () {
      await ensureIndexes(COLLECTION);
      const db = (await import("mongoose")).default.connection.db!;
      const indexes = await db.collection(COLLECTION).indexes();
      const nameIndex = indexes.find(
        (idx: any) => idx.key && idx.key.name === 1,
      );
      expect(nameIndex).to.exist;
      expect(nameIndex!.unique).to.equal(true);
    });
  });

  describe("upsertSeederRecord", function () {
    it("should insert a new record", async function () {
      await upsertSeederRecord(COLLECTION, {
        name: "test-seeder",
        executedAt: new Date(),
        status: "success",
      });
      const all = await getAllTrackedSeeders(COLLECTION);
      expect(all).to.have.lengthOf(1);
      expect(all[0].name).to.equal("test-seeder");
      expect(all[0].status).to.equal("success");
    });

    it("should update an existing record", async function () {
      await upsertSeederRecord(COLLECTION, {
        name: "test-seeder",
        executedAt: new Date(),
        status: "success",
      });
      await upsertSeederRecord(COLLECTION, {
        name: "test-seeder",
        executedAt: new Date(),
        status: "failed",
        error: "something broke",
      });
      const all = await getAllTrackedSeeders(COLLECTION);
      expect(all).to.have.lengthOf(1);
      expect(all[0].status).to.equal("failed");
      expect(all[0].error).to.equal("something broke");
    });
  });

  describe("getExecutedSeeders", function () {
    it("should return only successful seeders", async function () {
      await upsertSeederRecord(COLLECTION, {
        name: "seeder-a",
        executedAt: new Date(),
        status: "success",
      });
      await upsertSeederRecord(COLLECTION, {
        name: "seeder-b",
        executedAt: new Date(),
        status: "failed",
        error: "fail",
      });
      const executed = await getExecutedSeeders(COLLECTION);
      expect(executed).to.have.lengthOf(1);
      expect(executed[0].name).to.equal("seeder-a");
    });
  });

  describe("deleteSeederRecord", function () {
    it("should remove a record", async function () {
      await upsertSeederRecord(COLLECTION, {
        name: "seeder-to-delete",
        executedAt: new Date(),
        status: "success",
      });
      await deleteSeederRecord(COLLECTION, "seeder-to-delete");
      const all = await getAllTrackedSeeders(COLLECTION);
      expect(all).to.have.lengthOf(0);
    });
  });
});
