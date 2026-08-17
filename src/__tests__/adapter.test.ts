import { AGYAdapter } from '../adapter.js';

describe('AGYAdapter API & Execution Methods', () => {
  let mockRunner: jest.Mock;
  let adapter: AGYAdapter;

  beforeEach(() => {
    mockRunner = jest.fn().mockResolvedValue({
      stdout: 'Sample output from AGY',
      stderr: '',
      exitCode: 0,
      durationMs: 85,
      timedOut: false,
    });

    adapter = new AGYAdapter(
      {
        cliPath: '/usr/local/bin/agy',
        cwd: '/default/workspace',
        timeoutMs: 15000,
        env: { TEST_ENV: '1' },
      },
      mockRunner,
    );
  });

  it('should return configured CLI path', () => {
    expect(adapter.getCliPath()).toBe('/usr/local/bin/agy');
  });

  it('should execute startSession helper', async () => {
    const result = await adapter.startSession({
      prompt: 'Refactor code',
      projectPath: '/my/project',
      model: 'pro',
    });

    expect(result.output).toBe('Sample output from AGY');
    expect(mockRunner).toHaveBeenCalledWith({
      cliPath: '/usr/local/bin/agy',
      args: ['--model', 'pro', '--dangerously-skip-permissions', '--output-format', 'json', '--print', 'Refactor code'],
      cwd: '/my/project',
      env: { TEST_ENV: '1' },
      timeoutMs: 15000,
    });
  });

  it('should execute resumeSession helper with conversationId', async () => {
    const result = await adapter.resumeSession('conv-999', 'Continue task');

    expect(result.output).toBe('Sample output from AGY');
    expect(mockRunner).toHaveBeenCalledWith({
      cliPath: '/usr/local/bin/agy',
      args: ['--conversation', 'conv-999', '--dangerously-skip-permissions', '--output-format', 'json', '--print', 'Continue task'],
      cwd: '/default/workspace',
      env: { TEST_ENV: '1' },
      timeoutMs: 15000,
    });
  });

  it('should execute send helper', async () => {
    const result = await adapter.send('Quick status');
    expect(result.output).toBe('Sample output from AGY');
  });

  it('should return empty list for listSessions helper', async () => {
    const list = await adapter.listSessions();
    expect(list).toEqual([]);
  });

  it('should pass dangerouslySkipPermissions: false when specified', () => {
    const args = adapter.buildArgs({
      prompt: 'Safe run',
      dangerouslySkipPermissions: false,
    });

    expect(args).toEqual(['--output-format', 'json', '--print', 'Safe run']);
  });

  it('should extract response and conversation_id when output is JSON', async () => {
    mockRunner.mockResolvedValueOnce({
      stdout: JSON.stringify({
        conversation_id: 'new-uuid-123',
        response: 'JSON parsed output from AGY',
      }),
      stderr: '',
      exitCode: 0,
      durationMs: 90,
      timedOut: false,
    });

    const result = await adapter.send('Test JSON parsing');
    expect(result.output).toBe('JSON parsed output from AGY');
    expect(result.conversationId).toBe('new-uuid-123');
  });
});
