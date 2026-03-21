# Mongoose Seed Kit

[![npm version](https://badgen.net/npm/v/mongoose-seed-kit)](https://www.npmjs.com/package/mongoose-seed-kit)
[![license](https://badgen.net/npm/license/mongoose-seed-kit)](https://github.com/kulcsarrudolf/mongoose-seed-kit/blob/main/LICENSE)
[![downloads](https://img.shields.io/npm/dt/mongoose-seed-kit)](https://www.npmjs.com/package/mongoose-seed-kit)
[![GitHub Stars](https://badgen.net/github/stars/kulcsarrudolf/mongoose-seed-kit)](https://github.com/kulcsarrudolf/mongoose-seed-kit)
[![tests](https://img.shields.io/github/actions/workflow/status/kulcsarrudolf/mongoose-seed-kit/publish.yml?label=tests)](https://github.com/kulcsarrudolf/mongoose-seed-kit/actions)

A lightweight, zero-dependency seeder toolkit for Mongoose. Run one-time database seed scripts on app startup, track execution status, and manage seeders via CLI — all without registering any Mongoose models.

## Installation

```bash
npm install mongoose-seed-kit
```

**Peer dependency:** `mongoose >= 6.0.0`

## Quick Start

### 1. Create a config file

Create `mongoose-seed-kit.config.js` in your project root:

```javascript
module.exports = { seedersPath: "./src/db/seeders" };
```

### 2. Create your first seeder

```bash
npx mongoose-seed-kit create user
```

This generates `src/db/seeders/20260320120000-user.seeder.ts`.

### 3. Implement the seeder

Edit the generated file:

```typescript
const seed = async (): Promise<void> => {
  const User = require("../models/User").default;
  const exists = await User.findOne({ email: "admin@example.com" });
  if (exists) return;
  await User.create({ email: "admin@example.com", role: "admin" });
};

export default seed;
```

### 4. Run on app startup

```typescript
import mongoose from "mongoose";
import { runPendingSeeders } from "mongoose-seed-kit";

await mongoose.connect(process.env.DATABASE_URL);
const results = await runPendingSeeders();
```

## How It Works

1. Seeder files are sorted alphabetically — the timestamp prefix (`20260320120000-`) ensures chronological order.
2. On each `runPendingSeeders()` call, only seeders without a `success` record in the tracking collection are executed.
3. If a seeder fails, it is recorded as `failed` and will be retried on the next run. Execution continues with remaining seeders regardless.
4. Tracking is stored in a MongoDB collection (`seeders` by default) — no Mongoose model registration required.

## API

### `runPendingSeeders(config?)`

Runs all seeders that haven't been successfully executed yet. Returns `SeederRunResult[]`.

```typescript
const results = await runPendingSeeders();
// [{ name: "20260320120000-user.seeder", status: "success" }]
```

### `runSeederByName(name, config?)`

Force-runs a specific seeder by name (even if already executed). Returns `SeederRunResult[]`.

```typescript
const results = await runSeederByName("20260320120000-user.seeder");
```

### `getSeederStatuses(config?)`

Lists all seeders with their status (`pending`, `success`, or `failed`). Returns `SeederStatus[]`.

```typescript
const statuses = await getSeederStatuses();
// [{ name: "20260320120000-user.seeder", status: "success", executedAt: Date, error: null }]
```

### `resetSeeder(name, config?)`

Marks a seeder as pending again so it will re-run on next `runPendingSeeders()` call.

```typescript
await resetSeeder("20260320120000-user.seeder");
```

## Config

All functions accept an optional inline config. If omitted, the config file is loaded automatically.

| Option           | Type     | Default                                  | Description                              |
| ---------------- | -------- | ---------------------------------------- | ---------------------------------------- |
| `seedersPath`    | `string` | —                                        | Path to directory containing seeder files |
| `collectionName` | `string` | `"seeders"`                              | MongoDB collection for tracking execution |
| `filePattern`    | `RegExp` | `/^\d{14}-.+\.seeder\.(ts\|js)$/`        | Pattern to match seeder files            |

Config is resolved from (in order):

1. `mongoose-seed-kit.config.js`
2. `mongoose-seed-kit.config.json`
3. `"mongoose-seed-kit"` key in `package.json`

Or pass config inline:

```typescript
await runPendingSeeders({ seedersPath: "./seeders", collectionName: "my_seeders" });
```

## CLI

```bash
npx mongoose-seed-kit create <name>    # Scaffold a new seeder file
```

## Building Admin Routes

The package exposes helper functions — build your own routes:

```typescript
import { getSeederStatuses, runSeederByName, runPendingSeeders, resetSeeder } from "mongoose-seed-kit";

router.get("/seeders", async (req, res) => {
  res.json(await getSeederStatuses());
});

router.post("/seeders/run", async (req, res) => {
  const results = req.body.name
    ? await runSeederByName(req.body.name)
    : await runPendingSeeders();
  res.json(results);
});

router.post("/seeders/reset", async (req, res) => {
  await resetSeeder(req.body.name);
  res.json({ ok: true });
});
```

## Contributing

Submit a pull request or open an issue on GitHub.

## License

This project is licensed under the MIT License.

---

For more information, visit the [GitHub repository](https://github.com/kulcsarrudolf/mongoose-seed-kit).
