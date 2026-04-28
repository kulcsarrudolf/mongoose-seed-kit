# Mongoose Seed Kit

[![npm version](https://img.shields.io/npm/v/mongoose-seed-kit)](https://www.npmjs.com/package/mongoose-seed-kit)
[![license](https://badgen.net/npm/license/mongoose-seed-kit)](https://github.com/kulcsarrudolf/mongoose-seed-kit/blob/main/LICENSE)
[![downloads](https://img.shields.io/npm/dt/mongoose-seed-kit)](https://www.npmjs.com/package/mongoose-seed-kit)
[![GitHub Stars](https://badgen.net/github/stars/kulcsarrudolf/mongoose-seed-kit)](https://github.com/kulcsarrudolf/mongoose-seed-kit)
[![tests](https://img.shields.io/github/actions/workflow/status/kulcsarrudolf/mongoose-seed-kit/publish.yml?label=tests)](https://github.com/kulcsarrudolf/mongoose-seed-kit/actions)

A lightweight, zero-dependency seeder toolkit for Mongoose. Run one-time seed scripts on app startup, track execution status, and manage seeders via CLI without registering extra Mongoose models.

## Installation

```bash
npm install mongoose-seed-kit
```

**Peer dependency:** `mongoose >= 6.0.0`

## Quick Start

Create `mongoose-seed-kit.config.js`:

```javascript
module.exports = { seedersPath: "./src/db/seeders" };
```

Create a seeder:

```bash
npx mongoose-seed-kit create user
```

Then implement the generated `src/db/seeders/20260320120000-user.seeder.ts`:

```typescript
const seed = async (): Promise<void> => {
  const User = require("../models/User").default;
  const exists = await User.findOne({ email: "admin@example.com" });
  if (exists) return;
  await User.create({ email: "admin@example.com", role: "admin" });
};

export default seed;
```

Run pending seeders after connecting Mongoose:

```typescript
import mongoose from "mongoose";
import { runPendingSeeders } from "mongoose-seed-kit";

await mongoose.connect(process.env.DATABASE_URL);
await runPendingSeeders();
```

## How It Works

1. Seeder files are sorted alphabetically — the timestamp prefix (`20260320120000-`) ensures chronological order.
2. On each `runPendingSeeders()` call, only seeders without a `success` record in the tracking collection are executed.
3. If a seeder fails, it is recorded as `failed` and will be retried on the next run. Execution continues with remaining seeders regardless.
4. Tracking is stored in a MongoDB collection (`seeders` by default) — no Mongoose model registration required.

## API

All APIs accept an optional config override and assume Mongoose is already connected.

| Function                         | Description                                       | Returns             |
| -------------------------------- | ------------------------------------------------- | ------------------- |
| `runPendingSeeders(config?)`     | Runs seeders without a successful tracking record | `SeederRunResult[]` |
| `runSeederByName(name, config?)` | Force-runs one seeder, even if already executed   | `SeederRunResult[]` |
| `getSeederStatuses(config?)`     | Lists `pending`, `success`, and `failed` seeders  | `SeederStatus[]`    |
| `resetSeeder(name, config?)`     | Deletes the tracking record so a seeder can rerun | `Promise<void>`     |

## Config

Config is loaded from `mongoose-seed-kit.config.js`, `mongoose-seed-kit.config.json`, the `"mongoose-seed-kit"` key in `package.json`, or an inline override.

| Option           | Type                     | Default                           | Description                                                                                      |
| ---------------- | ------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `seedersPath`    | `string \| () => string` | —                                 | Path to directory containing seeder files. May be a function for runtime resolution (see below). |
| `collectionName` | `string`                 | `"seeders"`                       | MongoDB collection for tracking execution                                                        |
| `filePattern`    | `RegExp`                 | `/^\d{14}-.+\.seeder\.(ts\|js)$/` | Pattern to match seeder files                                                                    |
| `mongoUri`       | `string`                 | —                                 | Optional MongoDB URI used by CLI commands                                                        |

### `src` vs `dist`

If your app loads models from `src/` but seeders from `dist/`, Node can load the same model twice and Mongoose may throw `Cannot overwrite ... model once compiled.` Keep seeders in the same module graph as the app by using `resolveSeedersPath`:

```javascript
// mongoose-seed-kit.config.js
const path = require("path");
const { resolveSeedersPath } = require("mongoose-seed-kit");

module.exports = {
  seedersPath: resolveSeedersPath({
    src: path.join(__dirname, "src/db/seeders"),
    dist: path.join(__dirname, "dist/db/seeders"),
    srcWhen: () => process.env.NODE_ENV === "development",
  }),
};
```

The helper picks `src` when `srcWhen()` returns true or the runtime looks like `tsx`/`ts-node`; otherwise it picks `dist`. You can also pass your own `() => string` as `seedersPath`.

## CLI

```bash
npx mongoose-seed-kit create <name>    # Scaffold a new seeder file
npx mongoose-seed-kit status           # List seeders and statuses
npx mongoose-seed-kit run              # Run all pending seeders
npx mongoose-seed-kit run <name>       # Force-run one seeder by name
npx mongoose-seed-kit reset <name>     # Mark a seeder as pending
```

Commands that read/write status need `MONGODB_URI`, `DATABASE_URL`, or config `mongoUri`. `run` exits non-zero if any seeder fails.

```bash
MONGODB_URI=mongodb://localhost:27017/myapp npx mongoose-seed-kit status
MONGODB_URI=mongodb://localhost:27017/myapp npx mongoose-seed-kit run
```

## Building Admin Routes

Build admin routes with the same APIs:

```typescript
import {
  getSeederStatuses,
  runSeederByName,
  runPendingSeeders,
  resetSeeder,
} from "mongoose-seed-kit";

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
