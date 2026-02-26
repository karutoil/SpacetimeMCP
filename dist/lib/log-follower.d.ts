/**
 * LogFollower - Stream and tail SpacetimeDB logs
 */
import { EventEmitter } from 'events';
export interface LogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    source?: string;
}
export interface LogFollowerOptions {
    cwd?: string;
    env?: Record<string, string>;
}
export declare class LogFollower extends EventEmitter {
    private process;
    private buffer;
    private isFollowing;
    /**
     * Start following logs (non-blocking)
     */
    start(dbName: string, options?: LogFollowerOptions): void;
    /**
     * Stop following logs
     */
    stop(): void;
    /**
     * Handle incoming data
     */
    private handleData;
    /**
     * Parse a log line into a LogEntry
     */
    parseLine(line: string): LogEntry | null;
    /**
     * Normalize log level
     */
    private normalizeLevel;
    isActive(): boolean;
}
/**
 * Tail last N lines from logs (non-following)
 */
export declare function tailLogs(dbName: string, lines?: number, options?: LogFollowerOptions): Promise<LogEntry[]>;
//# sourceMappingURL=log-follower.d.ts.map