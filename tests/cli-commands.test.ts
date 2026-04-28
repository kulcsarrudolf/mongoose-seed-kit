import { expect } from "chai";
import mongoose from "mongoose";
import sinon from "sinon";
import { runCli } from "../src/cli/commands";
import * as configModule from "../src/config";
import * as runner from "../src/runner";

describe("cli commands", function () {
  let connectStub: sinon.SinonStub;
  let disconnectStub: sinon.SinonStub;
  let logStub: sinon.SinonStub;
  let errorStub: sinon.SinonStub;

  beforeEach(function () {
    sinon.stub(configModule, "loadConfig").returns({
      seedersPath: "/seeders",
      collectionName: "seeders",
      filePattern: /^\d{14}-.+\.seeder\.(ts|js)$/,
    });
    connectStub = sinon.stub(mongoose, "connect").resolves(mongoose);
    disconnectStub = sinon.stub(mongoose, "disconnect").resolves();
    logStub = sinon.stub(console, "log");
    errorStub = sinon.stub(console, "error");
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should print seeder statuses", async function () {
    sinon.stub(runner, "getSeederStatuses").resolves([
      {
        name: "20260101120000-user.seeder",
        status: "success",
        executedAt: new Date("2026-01-01T12:00:00.000Z"),
        error: null,
      },
      {
        name: "20260101120001-role.seeder",
        status: "pending",
        executedAt: null,
        error: null,
      },
    ]);

    const exitCode = await runCli(["status"], {
      MONGODB_URI: "mongodb://localhost/status",
    });

    expect(exitCode).to.equal(0);
    expect(connectStub.calledWith("mongodb://localhost/status")).to.be.true;
    expect(disconnectStub.calledOnce).to.be.true;
    expect(logStub.calledWithMatch("success")).to.be.true;
    expect(logStub.calledWithMatch("pending")).to.be.true;
  });

  it("should run pending seeders", async function () {
    sinon.stub(runner, "runPendingSeeders").resolves([
      { name: "20260101120000-user.seeder", status: "success" },
      { name: "20260101120001-role.seeder", status: "skipped" },
    ]);

    const exitCode = await runCli(["run"], {
      DATABASE_URL: "mongodb://localhost/run",
    });

    expect(exitCode).to.equal(0);
    expect(connectStub.calledWith("mongodb://localhost/run")).to.be.true;
    expect(logStub.calledWithMatch("success")).to.be.true;
    expect(logStub.calledWithMatch("skipped")).to.be.true;
  });

  it("should run one seeder by name", async function () {
    const runByNameStub = sinon
      .stub(runner, "runSeederByName")
      .resolves([{ name: "20260101120000-user.seeder", status: "success" }]);

    const exitCode = await runCli(["run", "20260101120000-user.seeder"], {
      MONGODB_URI: "mongodb://localhost/run-one",
    });

    expect(exitCode).to.equal(0);
    expect(runByNameStub.calledWith("20260101120000-user.seeder")).to.be.true;
  });

  it("should exit with failure when a seeder fails", async function () {
    sinon.stub(runner, "runPendingSeeders").resolves([
      {
        name: "20260101120000-user.seeder",
        status: "failed",
        error: "boom",
      },
    ]);

    const exitCode = await runCli(["run"], {
      MONGODB_URI: "mongodb://localhost/run-fail",
    });

    expect(exitCode).to.equal(1);
    expect(logStub.calledWithMatch("boom")).to.be.true;
  });

  it("should reset a seeder", async function () {
    const resetStub = sinon.stub(runner, "resetSeeder").resolves();

    const exitCode = await runCli(["reset", "20260101120000-user.seeder"], {
      MONGODB_URI: "mongodb://localhost/reset",
    });

    expect(exitCode).to.equal(0);
    expect(resetStub.calledWith("20260101120000-user.seeder")).to.be.true;
    expect(logStub.calledWith("Reset: 20260101120000-user.seeder")).to.be.true;
  });

  it("should fail when MongoDB URI is missing", async function () {
    const exitCode = await runCli(["status"], {});

    expect(exitCode).to.equal(1);
    expect(connectStub.notCalled).to.be.true;
    expect(errorStub.calledWithMatch("MongoDB URI is required")).to.be.true;
  });

  it("should use mongoUri from config when env is missing", async function () {
    sinon.restore();
    sinon.stub(configModule, "loadConfig").returns({
      seedersPath: "/seeders",
      collectionName: "seeders",
      filePattern: /^\d{14}-.+\.seeder\.(ts|js)$/,
      mongoUri: "mongodb://localhost/from-config",
    });
    connectStub = sinon.stub(mongoose, "connect").resolves(mongoose);
    disconnectStub = sinon.stub(mongoose, "disconnect").resolves();
    logStub = sinon.stub(console, "log");
    errorStub = sinon.stub(console, "error");
    sinon.stub(runner, "getSeederStatuses").resolves([]);

    const exitCode = await runCli(["status"], {});

    expect(exitCode).to.equal(0);
    expect(connectStub.calledWith("mongodb://localhost/from-config")).to.be
      .true;
    expect(disconnectStub.calledOnce).to.be.true;
  });
});
