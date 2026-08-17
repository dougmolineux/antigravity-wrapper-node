import { AGYAdapter } from '../adapter.js';

describe('AGY Model Surface & Telemetry', () => {
  it('should list available models with flash as default', async () => {
    const adapter = new AGYAdapter();
    const models = await adapter.getAvailableModels();

    expect(models.length).toBeGreaterThan(0);
    const flashModel = models.find((m) => m.id === 'flash');
    expect(flashModel).toBeDefined();
    expect(flashModel?.isDefault).toBe(true);
  });

  it('should surface current active model', () => {
    const adapterDefault = new AGYAdapter();
    expect(adapterDefault.getCurrentModel()).toBe('flash');

    const adapterCustom = new AGYAdapter({ defaultModel: 'pro' });
    expect(adapterCustom.getCurrentModel()).toBe('pro');
  });

  it('should correctly include --model flag in built CLI args when specified', () => {
    const adapter = new AGYAdapter({ defaultModel: 'flash' });

    const argsPro = adapter.buildArgs({
      prompt: 'Hello',
      model: 'pro',
    });
    expect(argsPro).toEqual(['--model', 'pro', '--dangerously-skip-permissions', '--output-format', 'json', '--print', 'Hello']);

    const argsInherit = adapter.buildArgs({
      prompt: 'Hello',
      model: 'inherit',
    });
    expect(argsInherit).toEqual(['--dangerously-skip-permissions', '--output-format', 'json', '--print', 'Hello']);
  });

  it('should attach modelUsed in execution result', async () => {
    const mockRunner = jest.fn().mockResolvedValue({
      stdout: 'Response output',
      stderr: '',
      exitCode: 0,
      durationMs: 120,
      timedOut: false,
    });

    const adapter = new AGYAdapter({ defaultModel: 'flash_lite' }, mockRunner);
    const result = await adapter.execute({ prompt: 'Analyze code' });

    expect(result.modelUsed).toBe('flash_lite');
    expect(result.output).toBe('Response output');
    expect(mockRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ['--model', 'flash_lite', '--dangerously-skip-permissions', '--output-format', 'json', '--print', 'Analyze code'],
      }),
    );
  });
});
