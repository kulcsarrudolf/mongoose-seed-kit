import { createSeeder } from "./create";

const args = process.argv.slice(2);
const command = args[0];

function printUsage(): void {
  console.log("Usage:");
  console.log("  mongoose-seed-kit create <name>   Create a new seeder file");
}

if (!command) {
  printUsage();
  process.exit(1);
}

switch (command) {
  case "create": {
    const name = args[1];
    if (!name) {
      console.error("Error: seeder name is required.");
      console.error("Usage: mongoose-seed-kit create <name>");
      process.exit(1);
    }
    createSeeder(name);
    break;
  }
  default:
    console.error(`Unknown command: "${command}"`);
    printUsage();
    process.exit(1);
}
