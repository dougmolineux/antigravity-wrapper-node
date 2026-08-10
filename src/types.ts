/**
 * Configuration options for initializing the AGY Client / Adapter.
 */
export interface AGYClientConfig {
  /** Path to the `agy` CLI binary (defaults to 'agy' in system PATH) */
  cliPath?: string;
  /** Default working directory for AGY CLI execution */
  cwd?: string;
  /** Environment variables to pass to the spawned AGY CLI process */
  env?: Record<string, string>;
  /** Default execution timeout in milliseconds (defaults to 10 minutes) */
  timeoutMs?: number;
  /** Default LLM model to request when invoking agy CLI */
  defaultModel?: string;
}

/**
 * Options for executing an AGY prompt or command.
 */
export interface AGYExecutionOptions {
  /** The text prompt or instruction to send to AGY */
  prompt: string;
  /** Working directory (e.g. target project directory) */
  projectPath?: string;
  /** Optional AGY conversation ID to resume */
  conversationId?: string;
  /** Override execution timeout in milliseconds */
  timeoutMs?: number;
  /** LLM model harness to use for this execution (e.g. 'flash', 'pro', 'flash_lite') */
  model?: string;
  /** Whether to append --dangerously-skip-permissions (defaults to true for non-interactive execution) */
  dangerouslySkipPermissions?: boolean;
}

/**
 * Result returned from executing an AGY prompt.
 */
export interface AGYExecutionResult {
  /** The verbatim stdout output produced by AGY */
  output: string;
  /** The AGY conversation ID associated with this session/execution */
  conversationId?: string;
  /** LLM model used during execution */
  modelUsed?: string;
  /** Exit code of the AGY process (0 for success) */
  exitCode: number;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Error message if execution failed */
  error?: string;
}

/**
 * Metadata representation of an AGY Model available in the harness.
 */
export interface AGYModelInfo {
  /** Identifier of the model (e.g. 'flash', 'pro', 'flash_lite') */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** Whether this model is the default harness model */
  isDefault: boolean;
}

/**
 * Configuration options for starting an AGYSession.
 */
export interface AGYSessionConfig {
  /** Target project working directory path */
  projectPath: string;
  /** Optional conversation ID to resume an existing thread */
  conversationId?: string;
  /** Optional model override for this session */
  model?: string;
}

/**
 * Metadata representation of an active or stored AGY Session.
 */
export interface AGYSessionInfo {
  /** Unique AGY conversation ID */
  conversationId: string;
  /** Target project directory path associated with the session */
  projectPath: string;
  /** Last activity timestamp */
  lastActivityAt: Date;
  /** Model specified for the session, if any */
  model?: string;
}
