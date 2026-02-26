/**
 * SchemaExtractor - Extract SpacetimeDB schema from source files
 * Parses Rust source to extract tables, reducers, views, and procedures
 */
export interface TableSchema {
    name: string;
    columns: ColumnInfo[];
    pk: string;
    indexes: IndexInfo[];
    is_public: boolean;
    is_scheduled: boolean;
}
export interface ColumnInfo {
    name: string;
    type: string;
    is_nullable: boolean;
}
export interface IndexInfo {
    name: string;
    columns: string[];
    is_unique: boolean;
}
export interface ReducerSchema {
    export_name: string;
    client_name: string;
    params: ParamInfo[];
    return_type: string | null;
    is_public: boolean;
}
export interface ParamInfo {
    name: string;
    type: string;
    is_nullable: boolean;
}
export interface ViewSchema {
    name: string;
    is_public: boolean;
    params: ParamInfo[];
    return_type: string;
}
export interface ProcedureSchema {
    name: string;
    is_public: boolean;
    params: ParamInfo[];
}
export interface ModuleSchema {
    tables: TableSchema[];
    reducers: ReducerSchema[];
    views: ViewSchema[];
    procedures: ProcedureSchema[];
}
/**
 * Extract SpacetimeDB module schema from Rust source
 */
export declare class SchemaExtractor {
    /**
     * Extract schema from a directory or specific file
     */
    static extract(sourcePath: string, options?: {
        useAst?: boolean;
    }): Promise<ModuleSchema>;
    /**
     * Find all Rust source files in a directory
     */
    private static findRustFiles;
    /**
     * Extract schema from a single Rust file
     */
    private static extractFromFile;
    /**
     * Extract table definitions using regex
     */
    private static extractTables;
    /**
     * Extract column definitions from table body
     */
    private static extractColumns;
    /**
     * Extract index definitions from OPTIONS
     */
    private static extractIndexes;
    /**
     * Extract reducer definitions
     */
    private static extractReducers;
    /**
     * Extract view definitions (SQL queries)
     */
    private static extractViews;
    /**
     * Extract procedure definitions
     */
    private static extractProcedures;
    /**
     * Extract parameters from function signature
     */
    private static extractParams;
    /**
     * Get a summary of the schema
     */
    static getSummary(schema: ModuleSchema): string;
}
//# sourceMappingURL=schema-extractor.d.ts.map