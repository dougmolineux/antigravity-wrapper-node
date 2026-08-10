import { runAGYProcess, AGYRunnerOptions, AGYRunnerResult } from './runner.js';
import {
  AGYClientConfig,
  AGYExecutionOptions,
  AGYExecutionResult,
  AGYModelInfo,
  AGYSessionInfo,
} from './types.js';

export type ProcessRunner = (options: AGYRunnerOptions) => Promise<AGYRunnerResult>;

/**
 * AGYAdapter (AGYClient)
 *
 * Fully decoupled Node.js SDK wrapper for the Google AGY CLI.
 * Handles flag construction, subprocess execution, model selection, and execution telemetry.
 */
export class AGYAdapter {
  private cliPath: string;
  private defaultCwd: string;
  private env: Record<string, string>;
  private timeoutMs: number;
  private defaultModel?: string;
  private runner: ProcessRunner;

  constructor(config: AGYClientConfig = {}, customRunner?: ProcessRunner) {
    this.cliPath = config.cliPath || 'agy';
    this.defaultCwd = config.cwd || process.cwd();
    this.env = config.env || {};
    this.timeoutMs = config.timeoutMs || 10 * 60 * 1000; // 10 minutes default
    this.defaultModel = config.defaultModel;
    this.runner = customRunner || runAGYProcess;
  }

  /**
   * Returns the current binary CLI path configured.
   */
  public getCliPath(): string {
    return this.cliPath;
  }

  /**
   * Returns default harness models supported by AGY.
   */
  public async getAvailableModels(): Promise<AGYModelInfo[]> {
    return [
      { id: 'flash', displayName: 'Gemini 3.6 Flash', isDefault: true },
      { id: 'pro', displayName: 'Gemini 3.6 Pro', isDefault: false },
      { id: 'flash_lite', displayName: 'Gemini Flash Lite', isDefault: false },
    ];
  }

  /**
   * Returns current active model.
   */
  public getCurrentModel(): string {
    return this.defaultModel || 'flash';
  }

  /**
   * Builds the CLI arguments array for an execution call.
   */
  public buildArgs(options: AGYExecutionOptions): string[] {
    const args: string[] = [];

    if (options.conversationId) {
      args.push('--conversation', options.conversationId);
    }

    const selectedModel = options.model || this.defaultModel;
    if (selectedModel && selectedModel !== 'inherit') {
      args.push('--model', selectedModel);
    }

    const skipPermissions = options.dangerouslySkipPermissions ?? true;
    if (skipPermissions) {
      args.push('--dangerously-skip-permissions');
    }

    args.push('--print', options.prompt);

    return args;
  }

  /**
   * Executes a prompt against AGY CLI.
   */
  public async execute(options: AGYExecutionOptions): Promise<AGYExecutionResult> {
    const cwd = options.projectPath || this.defaultCwd;
    const timeoutMs = options.timeoutMs || this.timeoutMs;
    const args = this.buildArgs(options);
    const selectedModel = options.model || this.defaultModel || 'flash';

    const result = await this.runner({
      cliPath: this.cliPath,
      args,
      cwd,
      env: this.env,
      timeoutMs,
    });

    return {
      output: result.stdout,
      conversationId: options.conversationId,
      modelUsed: selectedModel,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      error: result.error,
    };
  }

  /**
   * Starts a fresh execution session for a given prompt and directory.
   */
  public async startSession(options: {
    projectPath?: string;
    prompt: string;
    model?: string;
  }): Promise<AGYExecutionResult> {
    return this.execute({
      prompt: options.prompt,
      projectPath: options.projectPath,
      model: options.model,
    });
  }

  /**
   * Resumes an existing AGY conversation session.
   */
  public async resumeSession(
    conversationId: string,
    prompt: string,
    options: Omit<AGYExecutionOptions, 'prompt' | 'conversationId'> = {},
  ): Promise<AGYExecutionResult> {
    return this.execute({
      ...options,
      prompt,
      conversationId,
    });
  }

  /**
   * Helper method to send a prompt to AGY.
   */
  public async send(
    prompt: string,
    options: Omit<AGYExecutionOptions, 'prompt'> = {},
  ): Promise<AGYExecutionResult> {
    return this.execute({
      ...options,
      prompt,
    });
  }

  /**
   * Helper method to list active sessions metadata.
   */
  public async listSessions(): Promise<AGYSessionInfo[]> {
    return [];
  }
}
