import path from "path";
import fs from "fs";
import { expect } from "chai";
import sinon from "sinon";
import { createSeeder } from "../src/cli/create";
import * as configModule from "../src/config";

describe("cli create", function () {
  const tmpDir = path.join(__dirname, ".tmp-cli-test");

  beforeEach(function () {
    fs.mkdirSync(tmpDir, { recursive: true });
    sinon.stub(configModule, "loadConfig").returns({
      seedersPath: tmpDir,
      collectionName: "seeders",
      filePattern: /^\d{14}-.+\.seeder\.(ts|js)$/,
    });
  });

  afterEach(function () {
    sinon.restore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should create a seeder file with correct naming pattern", function () {
    createSeeder("user");
    const files = fs.readdirSync(tmpDir);
    expect(files).to.have.lengthOf(1);
    expect(files[0]).to.match(/^\d{14}-user\.seeder\.ts$/);
  });

  it("should contain the scaffold template", function () {
    createSeeder("test");
    const files = fs.readdirSync(tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, files[0]), "utf-8");
    expect(content).to.include("const seed = async ()");
    expect(content).to.include("export default seed");
    expect(content).to.include("TODO: implement seeder");
  });

  it("should create the seeders directory if it does not exist", function () {
    sinon.restore();
    const nestedDir = path.join(tmpDir, "nested", "seeders");
    sinon.stub(configModule, "loadConfig").returns({
      seedersPath: nestedDir,
      collectionName: "seeders",
      filePattern: /^\d{14}-.+\.seeder\.(ts|js)$/,
    });

    createSeeder("deep");
    expect(fs.existsSync(nestedDir)).to.be.true;
    const files = fs.readdirSync(nestedDir);
    expect(files).to.have.lengthOf(1);
  });
});
