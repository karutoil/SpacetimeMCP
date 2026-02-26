/**
 * SafeJSON - BigInt-safe JSON serialization
 * SpacetimeDB uses BigInt for IDs, which requires special handling
 */
export class SafeJSON {
    /**
     * Stringify with BigInt support
     */
    static stringify(obj) {
        return JSON.stringify(obj, this._reviver, 2);
    }
    /**
     * Parse BigInt strings (e.g., "123n") back to BigInt
     */
    static parse(text) {
        return JSON.parse(text, this._reviver);
    }
    /**
     * Custom reviver for stringify - converts BigInt to string representation
     */
    static _reviver(_key, value) {
        if (typeof value === 'bigint') {
            return { __bigint: true, value: value.toString() };
        }
        return value;
    }
    /**
     * Custom replacer for parse - restores BigInt from special format
     */
    static revive(_key, value) {
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
    static isBigInt(value) {
        return typeof value === 'bigint';
    }
    /**
     * Convert BigInt to safe string for display
     */
    static bigIntToString(value) {
        return value.toString() + 'n';
    }
    /**
     * Convert BigInt array to safe string array
     */
    static bigIntArrayToString(values) {
        return values.map(v => this.bigIntToString(v));
    }
    /**
     * Parse BigInt from string (supports "123n" or "123" formats)
     */
    static parseBigInt(str) {
        const cleaned = str.replace(/n$/, '');
        return BigInt(cleaned);
    }
}
export function successResponse(data, durationMs) {
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
export function errorResponse(errorCode, humanMessage, details, suggestedNextTools, durationMs = 0) {
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
//# sourceMappingURL=safe-json.js.map