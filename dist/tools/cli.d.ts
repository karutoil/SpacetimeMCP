/**
 * SpacetimeDB CLI Operator Tools
 */
import { ToolResponse } from '../lib/safe-json.js';
/**
 * Check CLI status
 */
export declare function stdb_cli_status(): Promise<ToolResponse>;
/**
 * Start SpacetimeDB server
 */
export declare function stdb_cli_start(dbName?: string): Promise<ToolResponse>;
/**
 * Publish module
 */
export declare function stdb_cli_publish(modulePath?: string): Promise<ToolResponse>;
/**
 * Generate bindings
 */
export declare function stdb_cli_generate_bindings(modulePath?: string): Promise<ToolResponse>;
/**
 * Tail logs
 */
export declare function stdb_cli_logs_tail(dbName?: string, lines?: number): Promise<ToolResponse>;
/**
 * Follow logs (returns start function - actual streaming done by client)
 */
export declare function stdb_cli_logs_follow(dbName?: string): Promise<ToolResponse>;
//# sourceMappingURL=cli.d.ts.map