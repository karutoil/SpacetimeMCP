/**
 * Debug Intelligence Tools
 */
import { ToolResponse } from '../lib/safe-json.js';
/**
 * Get last panic from logs
 */
export declare function stdb_debug_last_panic(dbName?: string, lines?: number): Promise<ToolResponse>;
/**
 * Explain an error
 */
export declare function stdb_debug_explain_error(errorText: string): Promise<ToolResponse>;
/**
 * Check server health
 */
export declare function stdb_debug_server_health(dbName?: string): Promise<ToolResponse>;
//# sourceMappingURL=debug.d.ts.map