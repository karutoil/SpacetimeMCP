/**
 * PanicParser - Parse SpacetimeDB panics and errors
 */
export interface PanicInfo {
    message: string;
    backtrace?: string[];
    location?: {
        file: string;
        line: number;
        column: number;
    };
    timestamp?: string;
    suggestions?: string[];
}
export interface ErrorInfo {
    error_type: 'panic' | 'runtime_error' | 'build_error' | 'connection_error';
    message: string;
    details?: any;
    location?: {
        file: string;
        line?: number;
    };
    suggestions?: string[];
}
/**
 * Parse a panic or error from logs
 */
export declare class PanicParser {
    /**
     * Parse a panic from a log entry or output
     */
    static parsePanic(text: string): PanicInfo | null;
    /**
     * Parse a Rust backtrace
     */
    private static parseBacktrace;
    /**
     * Get suggested fixes based on panic message
     */
    private static getSuggestions;
    /**
     * Parse a build error
     */
    static parseBuildError(output: string): ErrorInfo | null;
    /**
     * Get suggestions for build errors
     */
    private static getBuildSuggestions;
    /**
     * Format a panic for display
     */
    static formatPanic(panic: PanicInfo): string;
}
//# sourceMappingURL=panic-parser.d.ts.map