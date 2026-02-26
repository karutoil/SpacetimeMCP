/**
 * CommandRunner - Safe child process execution with timeouts
 */
export interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    signal: string | null;
}
export interface CommandOptions {
    timeout?: number;
    maxOutput?: number;
    cwd?: string;
    env?: Record<string, string>;
}
/**
 * Run a command with timeout and output limits
 */
export declare function runCommand(command: string, args: string[], options?: CommandOptions): Promise<CommandResult>;
/**
 * Run a shell command (with shell expansion)
 */
export declare function runShellCommand(command: string, options?: CommandOptions): Promise<CommandResult>;
/**
 * Check if a command exists
 */
export declare function commandExists(command: string): Promise<boolean>;
/**
 * Get command version
 */
export declare function getCommandVersion(command: string, args?: string[]): Promise<string | null>;
//# sourceMappingURL=command-runner.d.ts.map