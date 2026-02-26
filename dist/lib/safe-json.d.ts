/**
 * SafeJSON - BigInt-safe JSON serialization
 * SpacetimeDB uses BigInt for IDs, which requires special handling
 */
export declare class SafeJSON {
    /**
     * Stringify with BigInt support
     */
    static stringify(obj: any): string;
    /**
     * Parse BigInt strings (e.g., "123n") back to BigInt
     */
    static parse(text: string): any;
    /**
     * Custom reviver for stringify - converts BigInt to string representation
     */
    private static _reviver;
    /**
     * Custom replacer for parse - restores BigInt from special format
     */
    static revive(_key: string, value: any): any;
    /**
     * Check if a value is a BigInt
     */
    static isBigInt(value: any): boolean;
    /**
     * Convert BigInt to safe string for display
     */
    static bigIntToString(value: bigint): string;
    /**
     * Convert BigInt array to safe string array
     */
    static bigIntArrayToString(values: bigint[]): string[];
    /**
     * Parse BigInt from string (supports "123n" or "123" formats)
     */
    static parseBigInt(str: string): bigint;
}
/**
 * SafeResponse - Standard MCP response format
 */
export interface ToolResponse<T = any> {
    ok: boolean;
    data?: T;
    error?: {
        error_code: string;
        human_message: string;
        details?: any;
        suggested_next_tools?: string[];
    };
    meta: {
        duration_ms: number;
        timestamp: string;
        tool_version: string;
    };
}
export declare function successResponse<T>(data: T, durationMs: number): ToolResponse<T>;
export declare function errorResponse(errorCode: string, humanMessage: string, details?: any, suggestedNextTools?: string[], durationMs?: number): ToolResponse;
//# sourceMappingURL=safe-json.d.ts.map