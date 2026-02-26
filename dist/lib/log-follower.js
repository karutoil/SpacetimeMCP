/**
 * LogFollower - Stream and tail SpacetimeDB logs
 */
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
export class LogFollower extends EventEmitter {
    process = null;
    buffer = '';
    isFollowing = false;
    /**
     * Start following logs (non-blocking)
     */
    start(dbName, options = {}) {
        if (this.isFollowing) {
            return;
        }
        this.isFollowing = true;
        this.process = spawn('spacetime', ['logs', dbName, '--follow'], {
            cwd: options.cwd,
            env: { ...process.env, ...options.env },
            shell: false
        });
        this.process.stdout?.on('data', (data) => {
            this.handleData(data.toString());
        });
        this.process.stderr?.on('data', (data) => {
            this.emit('error', data.toString());
        });
        this.process.on('close', (code) => {
            this.isFollowing = false;
            this.emit('close', code);
        });
        this.process.on('error', (err) => {
            this.emit('error', err.message);
        });
    }
    /**
     * Stop following logs
     */
    stop() {
        if (this.process && !this.process.killed) {
            this.process.kill('SIGTERM');
        }
        this.isFollowing = false;
        this.process = null;
    }
    /**
     * Handle incoming data
     */
    handleData(data) {
        this.buffer += data;
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';
        for (const line of lines) {
            if (line.trim()) {
                const entry = this.parseLine(line);
                if (entry) {
                    this.emit('entry', entry);
                }
            }
        }
    }
    /**
     * Parse a log line into a LogEntry
     */
    parseLine(line) {
        // Try to parse as JSON first
        try {
            const parsed = JSON.parse(line);
            return {
                timestamp: parsed.timestamp || parsed.time || new Date().toISOString(),
                level: this.normalizeLevel(parsed.level || parsed.severity),
                message: parsed.message || parsed.msg || line,
                source: parsed.source || parsed.logger
            };
        }
        catch {
            // Fall back to text parsing
            const match = line.match(/^\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\]]*)\]\s*\[(\w+)\]\s*(.*)$/);
            if (match) {
                return {
                    timestamp: match[1],
                    level: this.normalizeLevel(match[2]),
                    message: match[3]
                };
            }
            // Just return as info
            return {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: line
            };
        }
    }
    /**
     * Normalize log level
     */
    normalizeLevel(level) {
        const l = level.toLowerCase();
        if (l === 'debug' || l === 'trace')
            return 'debug';
        if (l === 'warn' || l === 'warning')
            return 'warn';
        if (l === 'error' || l === 'err' || l === 'fatal')
            return 'error';
        return 'info';
    }
    isActive() {
        return this.isFollowing;
    }
}
/**
 * Tail last N lines from logs (non-following)
 */
export async function tailLogs(dbName, lines = 100, options = {}) {
    const { runCommand } = await import('./command-runner.js');
    const result = await runCommand('spacetime', ['logs', dbName, '--lines', lines.toString()], {
        cwd: options.cwd,
        env: options.env,
        timeout: 10000
    });
    if (result.exitCode !== 0 && result.exitCode !== null) {
        throw new Error(`Failed to tail logs: ${result.stderr}`);
    }
    const follower = new LogFollower();
    const entries = [];
    for (const line of result.stdout.split('\n')) {
        if (line.trim()) {
            const entry = follower.parseLine(line);
            if (entry) {
                entries.push(entry);
            }
        }
    }
    return entries;
}
//# sourceMappingURL=log-follower.js.map