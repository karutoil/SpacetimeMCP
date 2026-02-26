/**
 * Workspace Intelligence Tools
 */
import { ToolResponse } from '../lib/safe-json.js';
/**
 * Get workspace summary
 */
export declare function workspace_summary(): Promise<ToolResponse>;
/**
 * Search code in workspace
 */
export declare function workspace_search_code(pattern: string): Promise<ToolResponse>;
/**
 * Get git diff summary
 */
export declare function workspace_git_diff_summary(): Promise<ToolResponse>;
/**
 * Detect module path
 */
export declare function workspace_detect_module_path(): Promise<ToolResponse>;
/**
 * Detect bindings path
 */
export declare function workspace_detect_bindings_path(): Promise<ToolResponse>;
//# sourceMappingURL=workspace.d.ts.map