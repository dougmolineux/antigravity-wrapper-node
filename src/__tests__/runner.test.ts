import { EventEmitter } from 'events';
import * as child_process from 'child_process';
import { runAGYProcess } from '../runner.js';

jest.mock('child_process');

describe('AGYRunner (runAGYProcess)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute process successfully and capture stdout', async () => {
    const mockChild = new EventEmitter() as any;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    mockChild.kill = jest.fn();

    (child_process.spawn as jest.Mock).mockReturnValue(mockChild);

    const promise = runAGYProcess({
      cliPath: 'agy',
      args: ['--print', 'hello'],
      cwd: '/test/dir',
      timeoutMs: 5000,
    });

    mockChild.stdout.emit('data', Buffer.from('Hello from AGY'));
    mockChild.emit('close', 0);

    const result = await promise;

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('Hello from AGY');
    expect(result.stderr).toBe('');
    expect(result.timedOut).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it('should capture stderr on non-zero exit code', async () => {
    const mockChild = new EventEmitter() as any;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();

    (child_process.spawn as jest.Mock).mockReturnValue(mockChild);

    const promise = runAGYProcess({
      cliPath: 'agy',
      args: ['--invalid'],
      cwd: '/test/dir',
      timeoutMs: 5000,
    });

    mockChild.stderr.emit('data', 'Unknown flag --invalid');
    mockChild.emit('close', 1);

    const result = await promise;

    expect(result.exitCode).toBe(1);
    expect(result.error).toBe('Unknown flag --invalid');
  });

  it('should handle process timeout via SIGTERM', async () => {
    const mockChild = new EventEmitter() as any;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    mockChild.kill = jest.fn().mockImplementation(() => {
      mockChild.emit('close', null);
    });

    (child_process.spawn as jest.Mock).mockReturnValue(mockChild);

    const promise = runAGYProcess({
      cliPath: 'agy',
      args: ['--print', 'long task'],
      cwd: '/test/dir',
      timeoutMs: 1000,
    });

    jest.advanceTimersByTime(1000);

    const result = await promise;

    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    expect(result.timedOut).toBe(true);
    expect(result.exitCode).toBe(124);
    expect(result.error).toContain('timed out after 1000ms');
  });

  it('should handle ENOENT error when binary is missing', async () => {
    const mockChild = new EventEmitter() as any;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();

    (child_process.spawn as jest.Mock).mockReturnValue(mockChild);

    const promise = runAGYProcess({
      cliPath: 'nonexistent-agy',
      args: [],
      cwd: '/test/dir',
      timeoutMs: 5000,
    });

    const enoentError = new Error('spawn nonexistent-agy ENOENT') as any;
    enoentError.code = 'ENOENT';
    mockChild.emit('error', enoentError);

    const result = await promise;

    expect(result.exitCode).toBe(127);
    expect(result.error).toContain('AGY process error');
  });

  it('should catch synchronous spawn throws', async () => {
    (child_process.spawn as jest.Mock).mockImplementation(() => {
      throw new Error('Immediate spawn failure');
    });

    const result = await runAGYProcess({
      cliPath: 'bad-path',
      args: [],
      cwd: '/test/dir',
      timeoutMs: 5000,
    });

    expect(result.exitCode).toBe(1);
    expect(result.error).toContain('Failed to spawn AGY binary');
  });
});
