# NPM Publishing Specification

This document outlines the steps required to prepare, test, and publish this project to the NPM registry so it can be installed via `npm install`.

## 1. Package Configuration
Ensure that the `package.json` file contains all necessary metadata:
- **`name`**: A unique name for the package (e.g., `@your-username/antigravity-wrapper-node` or `antigravity-wrapper-node`).
- **`version`**: Follow semantic versioning (e.g., `1.0.0`).
- **`main`**: The entry point of the package (e.g., `index.js` or `dist/index.js`).
- **`types`**: If using TypeScript, point to the generated type definitions (e.g., `dist/index.d.ts`).
- **`description`**, **`keywords`**, **`author`**, **`license`**, **`repository`**: Fill these out for better discoverability and documentation.

## 2. Include/Exclude Files
To keep the package size small, specify exactly which files should be included when someone installs the package:
- The recommended approach is to use the `"files"` array in `package.json` to explicitly whitelist directories (e.g., `["dist", "README.md", "LICENSE"]`).
- Alternatively, you can use an `.npmignore` file to blacklist files (similar to `.gitignore`).

## 3. Build & Test Pipeline
Before publishing, ensure the code is stable and compiled:
- Add a `"build"` script if the code requires compilation (e.g., TypeScript or Babel).
- Add a `"test"` script.
- Add a `"prepublishOnly"` script in `package.json` to automatically run tests and builds right before publishing:
  ```json
  "scripts": {
    "build": "...",
    "test": "...",
    "prepublishOnly": "npm run test && npm run build"
  }
  ```

## 4. NPM Account & Authentication
- Check if your machine is already authenticated by running:
  ```bash
  npm whoami
  ```
  If this returns your username, you are already logged in and good to go!
- If you are not logged in, run `npm login` in your terminal and follow the prompts to authenticate. (Create an account on [npmjs.com](https://www.npmjs.com/) first if needed).

## 5. Publishing
- **Dry Run:** To see exactly what will be published and ensure no unwanted files are included, run:
  ```bash
  npm publish --dry-run
  ```
  Or use `npm pack` to generate a `.tgz` tarball that you can inspect and install locally.
- **Publish:** To push the package to the registry, run:
  ```bash
  npm publish
  ```
  *(Note: If you use a scoped package name like `@username/pkg`, you must run `npm publish --access public` the first time you publish it).*

## 6. Automation (Future Work)
Eventually, consider setting up a CI/CD pipeline (e.g., GitHub Actions) to automate publishing whenever a new GitHub Release is created. This involves generating an NPM automation token and adding it to your repository secrets.
