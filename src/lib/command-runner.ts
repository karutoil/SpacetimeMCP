/**
 * CommandRunner - Safe child process execution with timeouts
 */

import { spawn, ChildProcess } from 'child_process';
import { Readable } from 'stream';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  signal: string | null;
}

export interface CommandOptions {
  timeout?: number;        // Max execution time in ms (default: 60000)
  maxOutput?: number;      // Max output size in bytes (default: 1MB)
  cwd?: string;            // Working directory
  env?: Record<string, string>;  // Environment variables
}

const DEFAULT_TIMEOUT = 60000;
const DEFAULT_MAX_OUTPUT = 1024 * 1024; // 1MB

/**
 * Run a command with timeout and output limits
 */
export async function runCommand(
  command: string,
  args: string[],
  options: CommandOptions = {}
): Promise<CommandResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const maxOutput = options.maxOutput ?? DEFAULT_MAX_OUTPUT;

  let stdout = '';
  let stderr = '';
  let timedOut = false;
  let killed = false;

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: false
    });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');
      // Force kill after 5 seconds
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    const handleData = (data: Buffer, isStderr: boolean) => {
      const chunk = data.toString();
      const target = isStderr ? stderr : stdout;

      if (target.length + chunk.length > maxOutput) {
        const remaining = maxOutput - target.length;
        if (remaining > 0) {
          if (isStderr) {
            stderr += chunk.substring(0, remaining);
          } else {
            stdout += chunk.substring(0, remaining);
          }
        }
        // Kill process if output exceeds limit
        killed = true;
        child.kill('SIGTERM');
        return;
      }

      if (isStderr) {
        stderr += chunk;
      } else {
        stdout += chunk;
      }
    };

    child.stdout?.on('data', (data: Buffer) => handleData(data, false));
    child.stderr?.on('data', (data: Buffer) => handleData(data, true));

    child.on('close', (code, signal) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: code,
        timedOut,
        signal
      });
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr: stderr + '\n' + err.message,
        exitCode: -1,
        timedOut,
        signal: null
      });
    });
  });
}

/**
 * Run a shell command (with shell expansion)
 */
export async function runShellCommand(
  command: string,
  options: CommandOptions = {}
): Promise<CommandResult> {
  return runCommand('/bin/sh', ['-c', command], options);
}

/**
 * Check if a command exists
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await runCommand('which', [command], { timeout: 5000 });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Get command version
 */
export async function getCommandVersion(command: string, args: string[] = ['--version']): Promise<string | null> {
  try {
    const result = await runCommand(command, args, { timeout: 10000 });
    if (result.exitCode === 0) {
      return result.stdout.trim().split('\n')[0];
    }
    return null;
  } catch {
    return null;
  }
}
