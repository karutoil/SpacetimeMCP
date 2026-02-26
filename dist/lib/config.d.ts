/**
 * Configuration - Handle CLI flags and environment variables
 */
export interface SpacetimeDBConfig {
    projectRoot: string;
    modulePath: string | null;
    dbName: string | null;
    bindingsPath: string | null;
    uri: string | null;
    allowWrite: boolean;
    allowDangerous: boolean;
}
/**
 * Load configuration from CLI args and environment
 */
export declare function loadConfig(args?: string[]): SpacetimeDBConfig;
/**
 * Detect common project structure patterns
 */
export declare function detectProjectStructure(projectRoot: string): Promise<{
    modulePath: string | null;
    bindingsPath: string | null;
    dbName: string | null;
}>;
/**
 * Validate configuration
 */
export declare function validateConfig(config: SpacetimeDBConfig): {
    valid: boolean;
    errors: string[];
};
/**
 * Get help text for configuration
 */
export declare function getConfigHelp(): string;
//# sourceMappingURL=config.d.ts.map