# Setup Guide

Step-by-step guide for setting up the `mongoose-seed-kit` package from scratch.

## 1. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `mongoose-seed-kit`
3. Description: "A lightweight, zero-dependency seeder toolkit for Mongoose"
4. Visibility: Public
5. Initialize with: none (we push from local)

## 2. Initialize Local Repository

```bash
git init
git remote add origin git@github.com:kulcsarrudolf/mongoose-seed-kit.git
git branch -M main
```

## 3. Create npm Account & Package

1. If you don't have an npm account: [npmjs.com/signup](https://www.npmjs.com/signup)
2. Login locally:
   ```bash
   npm login
   ```
3. Verify the package name is available:
   ```bash
   npm view mongoose-seed-kit
   ```
   (should return 404 — name is free)

## 4. Generate npm Access Token (for CI/CD)

1. Go to [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens)
2. Click "Generate New Token" → "Classic Token"
3. Select type: **Automation** (for CI/CD, bypasses 2FA)
4. Copy the token (you won't see it again)

## 5. Add npm Token to GitHub Secrets

1. Go to `github.com/kulcsarrudolf/mongoose-seed-kit/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: paste the npm token from step 4
5. Click "Add secret"

## 6. Install Dependencies

```bash
yarn install
```

## 7. Setup Husky (Git Hooks)

```bash
npx husky init
```

This creates `.husky/` directory. The `prepare` script in `package.json` handles this automatically on `yarn install`.

## 8. First Build & Test

```bash
yarn build
yarn test
```

## 9. First Publish

### Option A: Manual

```bash
yarn build
npm publish
```

### Option B: Via release script

```bash
bash scripts/release.sh patch    # or: minor, major
```

### Option C: Via CI/CD (recommended)

```bash
git push origin main
git checkout -b release
git push origin release
```

The GitHub Action triggers on push to `release` branch and publishes to npm automatically.

## 10. Verify Publication

```bash
npm view mongoose-seed-kit
npx mongoose-seed-kit create test
```

## Checklist

- [ ] GitHub repository created
- [ ] npm account ready
- [ ] npm token generated (Automation type)
- [ ] `NPM_TOKEN` secret added to GitHub repo
- [ ] `yarn install` runs successfully
- [ ] `yarn build` compiles without errors
- [ ] `yarn test` passes
- [ ] First version published to npm
- [ ] `npx mongoose-seed-kit create test` works
