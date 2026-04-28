import mongoose from "mongoose";
import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from "@testcontainers/mongodb";
import { resetIndexesFlag } from "../../src/tracker";

let container: StartedMongoDBContainer;

export const mochaHooks = {
  async beforeAll(this: Mocha.Context) {
    this.timeout(120000);
    container = await new MongoDBContainer("mongo:7").start();
    const uri = container.getConnectionString() + "?directConnection=true";
    await mongoose.connect(uri);
  },

  async afterEach() {
    const db = mongoose.connection.db;
    if (db) {
      await db.collection("seeders").deleteMany({});
    }
    resetIndexesFlag();
  },

  async afterAll() {
    await mongoose.disconnect();
    if (container) {
      await container.stop();
    }
  },
};
