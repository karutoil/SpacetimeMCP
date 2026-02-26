/**
 * PanicParser - Parse SpacetimeDB panics and errors
 */

export interface PanicInfo {
  message: string;
  backtrace?: string[];
  location?: {
    file: string;
    line: number;
    column: number;
  };
  timestamp?: string;
  suggestions?: string[];
}

export interface ErrorInfo {
  error_type: 'panic' | 'runtime_error' | 'build_error' | 'connection_error';
  message: string;
  details?: any;
  location?: {
    file: string;
    line?: number;
  };
  suggestions?: string[];
}

/**
 * Parse a panic or error from logs
 */
export class PanicParser {
  /**
   * Parse a panic from a log entry or output
   */
  static parsePanic(text: string): PanicInfo | null {
    // Check for panic patterns
    const panicPatterns = [
      /thread '[^']+' panicked at '([^']+)'/,
      /panicked at '([^']+)'/,
      /panic: (.+)$/m
    ];

    for (const pattern of panicPatterns) {
      const match = text.match(pattern);
      if (match) {
        const panic: PanicInfo = {
          message: match[1]
        };

        // Try to extract backtrace
        const backtraceMatch = text.match(/stack backtrace:\n([\s\S]+)$/i);
        if (backtraceMatch) {
          panic.backtrace = this.parseBacktrace(backtraceMatch[1]);
        }

        // Try to extract location
        const locationMatch = text.match(/--> (.+):(\d+):(\d+)/);
        if (locationMatch) {
          panic.location = {
            file: locationMatch[1],
            line: parseInt(locationMatch[2], 10),
            column: parseInt(locationMatch[3], 10)
          };
        }

        // Add suggestions based on panic message
        panic.suggestions = this.getSuggestions(panic.message);

        return panic;
      }
    }

    return null;
  }

  /**
   * Parse a Rust backtrace
   */
  private static parseBacktrace(backtrace: string): string[] {
    const frames: string[] = [];

    for (const line of backtrace.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('0:')) {
        // Extract frame info
        const match = trimmed.match(/(\d+):\s*(.+)/);
        if (match) {
          frames.push(match[2]);
        } else if (trimmed) {
          frames.push(trimmed);
        }
      }
    }

    return frames.slice(0, 20); // Limit to first 20 frames
  }

  /**
   * Get suggested fixes based on panic message
   */
  private static getSuggestions(message: string): string[] {
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();

    // BigInt related
    if (lowerMessage.includes('bigint') || lowerMessage.includes('int128')) {
      suggestions.push(
        'SpacetimeDB uses BigInt for IDs. Use 0n as placeholder for auto-inc fields.',
        'When calling reducers from client, pass BigInt values as "123n" strings.'
      );
    }

    // Database related
    if (lowerMessage.includes('table') && lowerMessage.includes('not found')) {
      suggestions.push(
        'Make sure the table is defined with #[spacetime(table)] attribute.',
        'Run `spacetime generate` to update bindings.'
      );
    }

    // Reducer related
    if (lowerMessage.includes('reducer')) {
      suggestions.push(
        'Check reducer function signature matches client call.',
        'Reducers cannot return data - use tables or subscriptions to get data.',
        'Ensure reducer is marked as public if called externally.'
      );
    }

    // Serialization
    if (lowerMessage.includes('serialize') || lowerMessage.includes('deserialize')) {
      suggestions.push(
        'Check that all table fields implement required traits.',
        'Use the generated type bindings for client-side serialization.'
      );
    }

    // Connection
    if (lowerMessage.includes('connection') || lowerMessage.includes('connect')) {
      suggestions.push(
        'Make sure SpacetimeDB server is running: `spacetime start`',
        'Check the database name matches what you published.'
      );
    }

    return suggestions;
  }

  /**
   * Parse a build error
   */
  static parseBuildError(output: string): ErrorInfo | null {
    // Check for compilation errors
    const errorPatterns = [
      /^error\[E\d+\]:\s*(.+)$/m,
      /^   --> (.+):(\d+):(\d+)$/m,
      /failed to compile/mi
    ];

    let message = '';
    let location: ErrorInfo['location'] | undefined;

    for (const line of output.split('\n')) {
      const match = line.match(/^error(?:\[\w+\])?:\s*(.+)$/);
      if (match) {
        message = match[1];
      }

      const locMatch = line.match(/^   --> (.+):(\d+):(\d+)$/);
      if (locMatch && !location) {
        location = {
          file: locMatch[1],
          line: parseInt(locMatch[2], 10)
        };
      }
    }

    if (message) {
      return {
        error_type: 'build_error',
        message,
        location,
        suggestions: this.getBuildSuggestions(message, output)
      };
    }

    return null;
  }

  /**
   * Get suggestions for build errors
   */
  private static getBuildSuggestions(message: string, output: string): string[] {
    const suggestions: string[] = [];
    const lower = message.toLowerCase();

    if (lower.includes('not found')) {
      suggestions.push('Run `spacetime generate` to create missing bindings.');
    }

    if (lower.includes('trait') && lower.includes('serialize')) {
      suggestions.push('Add `#[derive(Serialize, Deserialize)]` to your struct.');
    }

    if (output.includes('cargo check')) {
      suggestions.push('Run `cargo check` for detailed Rust compilation errors.');
    }

    return suggestions;
  }

  /**
   * Format a panic for display
   */
  static formatPanic(panic: PanicInfo): string {
    const lines: string[] = [];

    lines.push(`## Panic: ${panic.message}`);

    if (panic.location) {
      lines.push(`\n**Location:** ${panic.location.file}:${panic.location.line}:${panic.location.column}`);
    }

    if (panic.backtrace && panic.backtrace.length > 0) {
      lines.push('\n**Backtrace:**');
      for (const frame of panic.backtrace.slice(0, 10)) {
        lines.push(`  ${frame}`);
      }
    }

    if (panic.suggestions && panic.suggestions.length > 0) {
      lines.push('\n**Suggestions:**');
      for (const suggestion of panic.suggestions) {
        lines.push(`- ${suggestion}`);
      }
    }

    return lines.join('\n');
  }
}
