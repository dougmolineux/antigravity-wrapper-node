import { spawn } from 'child_process';

export interface AGYRunnerOptions {
  cliPath: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  timeoutMs: number;
}

export interface AGYRunnerResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  error?: string;
  timedOut: boolean;
}

/**
 * Spawns an AGY CLI process and manages output streams, exit codes, signal killing, and timeouts.
 */
export function runAGYProcess(options: AGYRunnerOptions): Promise<AGYRunnerResult> {
  const startTime = Date.now();
  const { cliPath, args, cwd, env, timeoutMs } = options;

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let timedOut = false;

    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(cliPath, args, {
        cwd,
        env: { ...process.env, ...(env || {}) },
        shell: false,
      });
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      return resolve({
        stdout: '',
        stderr: err?.message || String(err),
        exitCode: 1,
        durationMs,
        error: `Failed to spawn AGY binary at "${cliPath}": ${err?.message || String(err)}`,
        timedOut: false,
      });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGTERM');
      } catch {
        // Ignored if process already exited
      }
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdoutData += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderrData += chunk.toString();
    });

    child.on('error', (err: Error) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      resolve({
        stdout: stdoutData.trim(),
        stderr: stderrData.trim() || err.message,
        exitCode: (err as any).code === 'ENOENT' ? 127 : 1,
        durationMs,
        error: `AGY process error: ${err.message}`,
        timedOut: false,
      });
    });

    child.on('close', (code: number | null) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      const exitCode = code ?? (timedOut ? 124 : 1);

      let error: string | undefined;
      if (timedOut) {
        error = `AGY process timed out after ${timeoutMs}ms.`;
      } else if (exitCode !== 0 && stderrData.trim()) {
        error = stderrData.trim();
      }

      resolve({
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
        exitCode,
        durationMs,
        error,
        timedOut,
      });
    });
  });
}
