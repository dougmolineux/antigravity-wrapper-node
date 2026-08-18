<div align="center">
  <img src="./logo.jpg" alt="Antigravity Wrapper Logo" width="300"/>
</div>

# AGY Node SDK (`antigravity-wrapper-node`)

[![npm version](https://img.shields.io/npm/v/antigravity-wrapper-node.svg)](https://www.npmjs.com/package/antigravity-wrapper-node)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/your-username/antigravity-wrapper-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, zero-dependency TypeScript/Node.js SDK wrapper around Google's **AGY CLI** (Antigravity CLI harness). Designed for programmatically executing prompts, inspecting model telemetry, and managing deterministic multi-turn AI sessions across local project workspaces.

---

## Installation

```bash
npm install antigravity-wrapper-node
# or
yarn add antigravity-wrapper-node
# or
pnpm add antigravity-wrapper-node
```

> **Prerequisite**: Google AGY CLI (`agy`) must be installed and available in your local system `PATH` (or specified via `cliPath`).

---

## Architecture

```mermaid
graph TD
    User([Node.js App / Developer]) -->|Uses| Adapter[AGYAdapter]
    User -->|Uses| SessionManager[AGYSessionManager]
    SessionManager -->|Creates/Manages| Session[AGYSession]
    Session -->|Uses| Adapter
    Adapter -->|Executes via| Runner[ProcessRunner]
    Runner -->|Spawns Subprocess| AGYCLI(Google AGY CLI Binary)
    AGYCLI -->|Returns Output| Runner
    Runner -->|Returns Raw Output| Adapter
    Adapter -->|Parses JSON & Returns| Session
    Adapter -->|Parses JSON & Returns| User
    Session -->|Returns Result| User
```

---

## Quickstart

### 1. Single Execution (`AGYAdapter`)

```typescript
import { AGYAdapter } from 'antigravity-wrapper-node';

const adapter = new AGYAdapter({
  cwd: '/path/to/your/project',
  defaultModel: 'flash',
});

async function main() {
  const result = await adapter.execute({
    prompt: 'Summarize the open TODOs in this repository.',
    model: 'flash',
  });

  console.log('Output:', result.output);
  console.log('Exit Code:', result.exitCode);
  console.log('Duration:', result.durationMs, 'ms');
  console.log('Model Used:', result.modelUsed);
}

main();
```

---

### 2. Multi-Turn Session Management (`AGYSessionManager`)

```typescript
import { AGYAdapter, AGYSessionManager } from 'antigravity-wrapper-node';

const adapter = new AGYAdapter();
const manager = new AGYSessionManager(adapter);

async function runSession() {
  // Create an isolated session bound to a project path
  const session = manager.createSession({
    projectPath: '/path/to/another/project',
    model: 'pro',
  });

  console.log('Session ID:', session.conversationId);

  // Turn 1
  const res1 = await session.send('Inspect package.json and list devDependencies.');
  console.log('Turn 1 Output:', res1.output);

  // Turn 2 (automatically retains conversation context and project directory)
  const res2 = await session.send('Which test runner is installed?');
  console.log('Turn 2 Output:', res2.output);

  // Inspect internal session history
  const history = await session.getHistory();
  console.log('History entries:', history.length);
}

runSession();
```

---

## Model Surface & Telemetry

Inspect available models or specify per-request model overrides (`flash`, `pro`, `flash_lite`, etc.):

```typescript
const models = await adapter.getAvailableModels();
console.log('Supported Harness Models:', models);

const activeModel = adapter.getCurrentModel();
console.log('Default Active Model:', activeModel);
```

---

## Testing & Coverage

The SDK features a 100% unit test suite built with **Jest**, thoroughly mocking subprocess execution, streams, timeouts, process signals, missing binary errors (`ENOENT`), and multi-session concurrency.

```bash
# Run unit tests
npm test

# Run test coverage report (Target: 100% lines/statements)
npm run test:coverage
```

---

## API Reference

### `AGYAdapter`
- `constructor(config?: AGYClientConfig, customRunner?: ProcessRunner)`
- `execute(options: AGYExecutionOptions): Promise<AGYExecutionResult>`
- `send(prompt: string, options?: Omit<AGYExecutionOptions, 'prompt'>): Promise<AGYExecutionResult>`
- `startSession(options: { projectPath?: string; prompt: string; model?: string }): Promise<AGYExecutionResult>`
- `resumeSession(conversationId: string, prompt: string, options?: Omit<AGYExecutionOptions, 'prompt' | 'conversationId'>): Promise<AGYExecutionResult>`
- `getAvailableModels(): Promise<AGYModelInfo[]>`
- `getCurrentModel(): string`
- `getCliPath(): string`

### `AGYSessionManager`
- `createSession(config: AGYSessionConfig): AGYSession`
- `resumeSession(conversationId: string): Promise<AGYSession | null>`
- `listSessions(): Promise<AGYSessionInfo[]>`
- `closeSession(conversationId: string): Promise<void>`

---

## License

MIT © Your Name
