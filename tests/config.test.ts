import path from "path";
import fs from "fs";
import { expect } from "chai";
import { loadConfig } from "../src/config";

describe("config", function () {
  const tmpDir = path.join(__dirname, ".tmp-config-test");

  beforeEach(function () {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(function () {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should apply default collectionName and filePattern", function () {
    const config = loadConfig({ seedersPath: "./seeders" });
    expect(config.collectionName).to.equal("seeders");
    expect(config.filePattern).to.be.instanceOf(RegExp);
  });

  it("should throw if seedersPath is missing", function () {
    const originalCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      expect(() => loadConfig()).to.throw("seedersPath");
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("should resolve relative seedersPath to absolute", function () {
    const config = loadConfig({ seedersPath: "./src/db/seeders" });
    expect(path.isAbsolute(config.seedersPath)).to.be.true;
  });

  it("should allow inline overrides to take precedence", function () {
    const config = loadConfig({
      seedersPath: "./seeders",
      collectionName: "custom_seeders",
    });
    expect(config.collectionName).to.equal("custom_seeders");
  });

  it("should resolve config from mongoose-seed-kit.config.js", function () {
    const configFile = path.join(tmpDir, "mongoose-seed-kit.config.js");
    fs.writeFileSync(
      configFile,
      'module.exports = { seedersPath: "./my-seeders" };',
    );

    const originalCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      const config = loadConfig();
      expect(config.seedersPath).to.include("my-seeders");
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("should accept seedersPath as a function and resolve lazily", function () {
    let calls = 0;
    const config = loadConfig({
      seedersPath: () => {
        calls += 1;
        return path.join(tmpDir, "lazy-seeders");
      },
    });
    expect(calls).to.equal(1);
    expect(config.seedersPath).to.equal(path.join(tmpDir, "lazy-seeders"));
  });

  it("should throw if seedersPath function returns empty", function () {
    expect(() =>
      loadConfig({ seedersPath: () => "" }),
    ).to.throw("non-empty string");
  });

  it("should resolve config from package.json", function () {
    const pkgFile = path.join(tmpDir, "package.json");
    fs.writeFileSync(
      pkgFile,
      JSON.stringify({
        name: "test",
        "mongoose-seed-kit": { seedersPath: "./pkg-seeders" },
      }),
    );

    const originalCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      const config = loadConfig();
      expect(config.seedersPath).to.include("pkg-seeders");
    } finally {
      process.chdir(originalCwd);
    }
  });
});
