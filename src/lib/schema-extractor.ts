/**
 * SchemaExtractor - Extract SpacetimeDB schema from source files
 * Parses Rust source to extract tables, reducers, views, and procedures
 */

import * as fs from 'fs';
import * as path from 'path';

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
export class SchemaExtractor {
  /**
   * Extract schema from a directory or specific file
   */
  static async extract(
    sourcePath: string,
    options: { useAst?: boolean } = {}
  ): Promise<ModuleSchema> {
    // Find all .rs files in the module
    const rustFiles = this.findRustFiles(sourcePath);

    let schema: ModuleSchema = {
      tables: [],
      reducers: [],
      views: [],
      procedures: []
    };

    for (const file of rustFiles) {
      const fileSchema = this.extractFromFile(file);
      schema.tables.push(...fileSchema.tables);
      schema.reducers.push(...fileSchema.reducers);
      schema.views.push(...fileSchema.views);
      schema.procedures.push(...fileSchema.procedures);
    }

    return schema;
  }

  /**
   * Find all Rust source files in a directory
   */
  private static findRustFiles(dirPath: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip common non-source directories
        if (!['target', 'node_modules', '.git'].includes(entry.name)) {
          files.push(...this.findRustFiles(fullPath));
        }
      } else if (entry.name.endsWith('.rs')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Extract schema from a single Rust file
   */
  private static extractFromFile(filePath: string): ModuleSchema {
    const content = fs.readFileSync(filePath, 'utf-8');

    return {
      tables: this.extractTables(content),
      reducers: this.extractReducers(content),
      views: this.extractViews(content),
      procedures: this.extractProcedures(content)
    };
  }

  /**
   * Extract table definitions using regex
   */
  private static extractTables(content: string): TableSchema[] {
    const tables: TableSchema[] = [];

    // Match table definitions: #[spacetime(..., ...)]
    // table_name { ... }
    const tablePattern = /#\[spacetime\([^)]*\)\]\s*pub\s+struct\s+(\w+)\s*\{([^}]+)\}/g;

    let match;
    while ((match = tablePattern.exec(content)) !== null) {
      const tableName = match[1];
      const body = match[2];

      const columns = this.extractColumns(body);
      const indexes = this.extractIndexes(content, tableName);

      tables.push({
        name: tableName,
        columns,
        pk: columns[0]?.name || 'id',
        indexes,
        is_public: true,
        is_scheduled: false
      });
    }

    // Also match scheduled tables
    const scheduledPattern = /#\[spacetime\([^)]*schedule[^)]*\)\]\s*pub\s+struct\s+(\w+)/g;
    while ((match = scheduledPattern.exec(content)) !== null) {
      const tableName = match[1];
      const existing = tables.find(t => t.name === tableName);
      if (existing) {
        existing.is_scheduled = true;
      }
    }

    return tables;
  }

  /**
   * Extract column definitions from table body
   */
  private static extractColumns(body: string): ColumnInfo[] {
    const columns: ColumnInfo[] = [];

    // Match column definitions: pub name: Type, or pub name: Option<Type>,
    const columnPattern = /pub\s+(\w+)\s*:\s*(Option<([^>]+)>|(\w+))/g;

    let match;
    while ((match = columnPattern.exec(body)) !== null) {
      const name = match[1];
      const isOptional = match[2].startsWith('Option');
      const type = isOptional ? match[3] : match[4];

      columns.push({
        name,
        type,
        is_nullable: isOptional
      });
    }

    return columns;
  }

  /**
   * Extract index definitions from OPTIONS
   */
  private static extractIndexes(content: string, tableName: string): IndexInfo[] {
    const indexes: IndexInfo[] = [];

    // Find the table's OPTIONS block
    const tableOptionsPattern = new RegExp(
      `table\\s+${tableName}\\s*\\{[^}]*\\}\\s*OPTIONS\\s*\\{([^}]+)\\}`,
      's'
    );

    const optionsMatch = content.match(tableOptionsPattern);
    if (!optionsMatch) {
      return indexes;
    }

    const optionsBody = optionsMatch[1];

    // Match index definitions: index_name = { columns = [...], ... }
    const indexPattern = /(\w+)\s*=\s*\{[^}]*columns\s*=\s*\[[^\]]+\][^}]*\}/g;

    let match;
    while ((match = indexPattern.exec(optionsBody)) !== null) {
      const indexName = match[1];
      const indexBody = match[0];

      const columnsMatch = indexBody.match(/columns\s*=\s*\[([^\]]+)\]/);
      const uniqueMatch = indexBody.match(/unique\s*=\s*(true|false)/);

      if (columnsMatch) {
        const columnNames = columnsMatch[1]
          .split(',')
          .map(s => s.trim().replace(/"/g, ''));

        indexes.push({
          name: indexName,
          columns: columnNames,
          is_unique: uniqueMatch ? uniqueMatch[1] === 'true' : false
        });
      }
    }

    return indexes;
  }

  /**
   * Extract reducer definitions
   */
  private static extractReducers(content: string): ReducerSchema[] {
    const reducers: ReducerSchema[] = [];

    // Match: #[spacetime(..., ...)] pub fn reducer_name(...)
    // or: #[reducer] pub fn reducer_name(...)
    const reducerPattern = /#\[(?:spacetime\([^)]*\)|reducer)\]\s*(?:pub\s+)?fn\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*(\w+))?/g;

    let match;
    while ((match = reducerPattern.exec(content)) !== null) {
      const funcName = match[1];
      const paramsStr = match[2];
      const returnType = match[3] || null;

      // Skip internal functions
      if (funcName.startsWith('_') || funcName === 'reducer') {
        continue;
      }

      const params = this.extractParams(paramsStr);

      reducers.push({
        export_name: funcName,
        client_name: funcName, // Usually same in SpacetimeDB
        params,
        return_type: returnType,
        is_public: true
      });
    }

    return reducers;
  }

  /**
   * Extract view definitions (SQL queries)
   */
  private static extractViews(content: string): ViewSchema[] {
    const views: ViewSchema[] = [];

    // Match: #[spacetime(...)] pub fn view_name(...) -> Result<...>
    const viewPattern = /#\[spacetime\([^)]*view[^)]*\)\]\s*pub\s+fn\s+(\w+)\s*\(([^)]*)\)\s*->\s*Result<(\w+),\s*(\w+)>/g;

    let match;
    while ((match = viewPattern.exec(content)) !== null) {
      const name = match[1];
      const paramsStr = match[2];
      const returnType = match[3];

      views.push({
        name,
        is_public: true,
        params: this.extractParams(paramsStr),
        return_type: returnType
      });
    }

    return views;
  }

  /**
   * Extract procedure definitions
   */
  private static extractProcedures(content: string): ProcedureSchema[] {
    const procedures: ProcedureSchema[] = [];

    // Match: #[spacetime(...)] pub fn procedure_name(...)
    const procPattern = /#\[spacetime\([^)]*procedure[^)]*\)\]\s*pub\s+fn\s+(\w+)\s*\(([^)]*)\)/g;

    let match;
    while ((match = procPattern.exec(content)) !== null) {
      const name = match[1];
      const paramsStr = match[2];

      procedures.push({
        name,
        is_public: true,
        params: this.extractParams(paramsStr)
      });
    }

    return procedures;
  }

  /**
   * Extract parameters from function signature
   */
  private static extractParams(paramsStr: string): ParamInfo[] {
    const params: ParamInfo[] = [];

    if (!paramsStr.trim()) {
      return params;
    }

    // Match each parameter: name: Type or name: Option<Type>
    const paramPattern = /(\w+)\s*:\s*(Option<([^>]+)>|(\w+))/g;

    let match;
    while ((match = paramPattern.exec(paramsStr)) !== null) {
      const name = match[1];
      const isOptional = match[2].startsWith('Option');
      const type = isOptional ? match[3] : match[4];

      params.push({
        name,
        type,
        is_nullable: isOptional
      });
    }

    return params;
  }

  /**
   * Get a summary of the schema
   */
  static getSummary(schema: ModuleSchema): string {
    const lines: string[] = [];

    lines.push(`## Tables (${schema.tables.length})`);
    for (const table of schema.tables) {
      const cols = table.columns.map(c => `${c.name}: ${c.type}`).join(', ');
      lines.push(`- ${table.name}: ${cols}`);
    }

    if (schema.reducers.length > 0) {
      lines.push(`\n## Reducers (${schema.reducers.length})`);
      for (const reducer of schema.reducers) {
        const params = reducer.params.map(p => `${p.name}: ${p.type}`).join(', ');
        lines.push(`- ${reducer.export_name}(${params})`);
      }
    }

    if (schema.views.length > 0) {
      lines.push(`\n## Views (${schema.views.length})`);
      for (const view of schema.views) {
        lines.push(`- ${view.name} -> ${view.return_type}`);
      }
    }

    return lines.join('\n');
  }
}
