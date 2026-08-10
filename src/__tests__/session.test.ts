import { AGYAdapter } from '../adapter.js';
import { AGYSessionManager } from '../session.js';

describe('AGYSession & AGYSessionManager', () => {
  let mockRunner: jest.Mock;
  let adapter: AGYAdapter;
  let manager: AGYSessionManager;

  beforeEach(() => {
    mockRunner = jest.fn().mockResolvedValue({
      stdout: 'Assistant response',
      stderr: '',
      exitCode: 0,
      durationMs: 150,
      timedOut: false,
    });

    adapter = new AGYAdapter({ cwd: '/default/project' }, mockRunner);
    manager = new AGYSessionManager(adapter);
  });

  it('should create a session with generated conversationId and projectPath', () => {
    const session = manager.createSession({
      projectPath: '/Users/doug/dev/app',
    });

    expect(session.conversationId).toBeDefined();
    expect(session.projectPath).toBe('/Users/doug/dev/app');
  });

  it('should preserve conversationId across multi-turn prompts', async () => {
    const session = manager.createSession({
      projectPath: '/Users/doug/dev/app',
      conversationId: 'session-12345',
    });

    await session.send('First message');
    await session.send('Second message');

    expect(mockRunner).toHaveBeenCalledTimes(2);
    expect(mockRunner).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        cwd: '/Users/doug/dev/app',
        args: expect.arrayContaining(['--conversation', 'session-12345', '--print', 'First message']),
      }),
    );
    expect(mockRunner).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        cwd: '/Users/doug/dev/app',
        args: expect.arrayContaining(['--conversation', 'session-12345', '--print', 'Second message']),
      }),
    );
  });

  it('should maintain message history in AGYSession', async () => {
    const session = manager.createSession({
      projectPath: '/test/path',
    });

    await session.send('What is 2+2?');
    const history = await session.getHistory();

    expect(history.length).toBe(2);
    expect(history[0]).toEqual({
      role: 'user',
      content: 'What is 2+2?',
      timestamp: expect.any(Date),
    });
    expect(history[1]).toEqual({
      role: 'assistant',
      content: 'Assistant response',
      timestamp: expect.any(Date),
    });
  });

  it('should support resumeSession, listSessions, and closeSession in manager', async () => {
    const session = manager.createSession({
      projectPath: '/test/path',
      conversationId: 'conv-abc',
    });

    const activeList = await manager.listSessions();
    expect(activeList.length).toBe(1);
    expect(activeList[0].conversationId).toBe('conv-abc');

    const retrieved = await manager.resumeSession('conv-abc');
    expect(retrieved).toBe(session);

    const nonExistent = await manager.resumeSession('missing-id');
    expect(nonExistent).toBeNull();

    await manager.closeSession('conv-abc');
    const listAfterClose = await manager.listSessions();
    expect(listAfterClose.length).toBe(0);
  });
});
