/**
 * SafeJSON - BigInt-safe JSON serialization
 * SpacetimeDB uses BigInt for IDs, which requires special handling
 */

export class SafeJSON {
  /**
   * Stringify with BigInt support
   */
  static stringify(obj: any): string {
    return JSON.stringify(obj, this._reviver, 2);
  }

  /**
   * Parse BigInt strings (e.g., "123n") back to BigInt
   */
  static parse(text: string): any {
    return JSON.parse(text, this._reviver);
  }

  /**
   * Custom reviver for stringify - converts BigInt to string representation
   */
  private static _reviver(_key: string, value: any): any {
    if (typeof value === 'bigint') {
      return { __bigint: true, value: value.toString() };
    }
    return value;
  }

  /**
   * Custom replacer for parse - restores BigInt from special format
   */
  static revive(_key: string, value: any): any {
    if (value && typeof value === 'object' && value.__bigint === true) {
      return BigInt(value.value);
    }
    if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        value[key] = this.revive(key, value[key]);
      }
    }
    return value;
  }

  /**
   * Check if a value is a BigInt
   */
  static isBigInt(value: any): boolean {
    return typeof value === 'bigint';
  }

  /**
   * Convert BigInt to safe string for display
   */
  static bigIntToString(value: bigint): string {
    return value.toString() + 'n';
  }

  /**
   * Convert BigInt array to safe string array
   */
  static bigIntArrayToString(values: bigint[]): string[] {
    return values.map(v => this.bigIntToString(v));
  }

  /**
   * Parse BigInt from string (supports "123n" or "123" formats)
   */
  static parseBigInt(str: string): bigint {
    const cleaned = str.replace(/n$/, '');
    return BigInt(cleaned);
  }
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

export function successResponse<T>(data: T, durationMs: number): ToolResponse<T> {
  return {
    ok: true,
    data,
    meta: {
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
      tool_version: '1.0.0'
    }
  };
}

export function errorResponse(
  errorCode: string,
  humanMessage: string,
  details?: any,
  suggestedNextTools?: string[],
  durationMs: number = 0
): ToolResponse {
  return {
    ok: false,
    error: {
      error_code: errorCode,
      human_message: humanMessage,
      details,
      suggested_next_tools: suggestedNextTools
    },
    meta: {
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
      tool_version: '1.0.0'
    }
  };
}
