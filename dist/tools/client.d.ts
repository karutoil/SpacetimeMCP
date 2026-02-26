/**
 * SpacetimeDB Client Tools (Optional Runtime)
 * These require explicit permission and safety checks
 */
import { ToolResponse } from '../lib/safe-json.js';
/**
 * Connect to SpacetimeDB (returns connection info, doesn't actually connect)
 */
export declare function stdb_client_connect(uri?: string): Promise<ToolResponse>;
/**
 * Subscribe to data (returns subscription guidance)
 */
export declare function stdb_client_subscribe(subscription: string): Promise<ToolResponse>;
/**
 * Call a reducer (returns guidance)
 */
export declare function stdb_client_reducer_call(params: {
    reducerName: string;
    args: Record<string, any>;
}): Promise<ToolResponse>;
//# sourceMappingURL=client.d.ts.map