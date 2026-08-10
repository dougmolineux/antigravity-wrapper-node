import { AGYAdapter } from '../adapter.js';
import { AGYSessionManager } from '../session.js';

describe('AGY Live Integration Tests', () => {
  const isLive = process.env.TEST_LIVE_AGY === '1';

  // Helper to conditionally skip tests
  const testIfLive = isLive ? test : test.skip;

  let adapter: AGYAdapter;

  beforeAll(() => {
    adapter = new AGYAdapter({
      // You can override cliPath if needed via process.env.AGY_CLI_PATH
      defaultModel: process.env.TEST_LIVE_AGY_MODEL || 'flash_lite', // Explicitly force the cheapest model
    });
  });

  testIfLive('should successfully return the AGY CLI version (Free/No-token)', async () => {
    const result = await adapter.execute({
      prompt: '--version',
      dangerouslySkipPermissions: true,
    });
    
    expect(result.exitCode).toBe(0);
    expect(result.output).toBeDefined();
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.error).toBeFalsy();
  }, 30000);

  testIfLive('should execute a simple prompt using the configured cheap model', async () => {
    // We keep the prompt ultra-short to minimize token usage
    const result = await adapter.execute({
      prompt: 'Say the exact word: Hello',
      model: process.env.TEST_LIVE_AGY_MODEL || 'flash_lite', // Enforce lightweight model
    });

    expect(result.exitCode).toBe(0);
    expect(result.output).toMatch(/hello/i);
    // Should parse the model correctly
    expect(result.modelUsed).toBe(process.env.TEST_LIVE_AGY_MODEL || 'flash_lite');
  }, 60000);

  testIfLive('should maintain multi-turn conversation state', async () => {
    const manager = new AGYSessionManager(adapter);
    const session = manager.createSession({
      projectPath: process.cwd(),
      model: process.env.TEST_LIVE_AGY_MODEL || 'flash_lite',
    });

    // Turn 1
    const result1 = await session.send('My secret code is 8675309.');

    expect(result1.exitCode).toBe(0);
    expect(session.conversationId).toBeDefined();

    // Turn 2
    const result2 = await session.send('What is my secret code?');

    expect(result2.exitCode).toBe(0);
    expect(result2.output).toContain('8675309');
  }, 120000);
});
