import { randomUUID } from 'crypto';
import { AGYAdapter } from './adapter.js';
import {
  AGYExecutionOptions,
  AGYExecutionResult,
  AGYSessionConfig,
  AGYSessionInfo,
} from './types.js';

export interface MessageExchange {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Stateful wrapper representing an isolated multi-turn conversation thread.
 */
export class AGYSession {
  readonly conversationId: string;
  readonly projectPath: string;
  readonly model?: string;
  private adapter: AGYAdapter;
  private history: MessageExchange[] = [];
  private lastActivityAt: Date;

  constructor(adapter: AGYAdapter, config: AGYSessionConfig) {
    this.adapter = adapter;
    this.projectPath = config.projectPath;
    this.conversationId = config.conversationId || randomUUID();
    this.model = config.model;
    this.lastActivityAt = new Date();
  }

  /**
   * Sends a prompt within this session thread, automatically injecting conversationId and projectPath.
   */
  public async send(
    prompt: string,
    options: Omit<AGYExecutionOptions, 'prompt' | 'conversationId' | 'projectPath'> = {},
  ): Promise<AGYExecutionResult> {
    this.history.push({ role: 'user', content: prompt, timestamp: new Date() });

    const result = await this.adapter.execute({
      ...options,
      prompt,
      conversationId: this.conversationId,
      projectPath: this.projectPath,
      model: options.model || this.model,
    });

    this.lastActivityAt = new Date();

    if (result.output) {
      this.history.push({
        role: 'assistant',
        content: result.output,
        timestamp: new Date(),
      });
    }

    return result;
  }

  /**
   * Retrieves full recorded message history for this active session.
   */
  public async getHistory(): Promise<MessageExchange[]> {
    return [...this.history];
  }

  /**
   * Returns metadata info for this session.
   */
  public getInfo(): AGYSessionInfo {
    return {
      conversationId: this.conversationId,
      projectPath: this.projectPath,
      lastActivityAt: this.lastActivityAt,
      model: this.model,
    };
  }
}

/**
 * Manages active AGYSession contexts, preventing thread bleeding and managing lifecycle.
 */
export class AGYSessionManager {
  private adapter: AGYAdapter;
  private sessions = new Map<string, AGYSession>();

  constructor(adapter: AGYAdapter) {
    this.adapter = adapter;
  }

  /**
   * Creates and registers a new isolated AGYSession.
   */
  public createSession(config: AGYSessionConfig): AGYSession {
    const session = new AGYSession(this.adapter, config);
    this.sessions.set(session.conversationId, session);
    return session;
  }

  /**
   * Resumes an existing tracked session by conversationId.
   */
  public async resumeSession(conversationId: string): Promise<AGYSession | null> {
    return this.sessions.get(conversationId) || null;
  }

  /**
   * Lists all active tracked sessions.
   */
  public async listSessions(): Promise<AGYSessionInfo[]> {
    return Array.from(this.sessions.values()).map((s) => s.getInfo());
  }

  /**
   * Closes and unregisters an active session context.
   */
  public async closeSession(conversationId: string): Promise<void> {
    this.sessions.delete(conversationId);
  }
}
