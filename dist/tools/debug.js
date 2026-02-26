/**
 * Debug Intelligence Tools
 */
import { runCommand } from '../lib/command-runner.js';
import { PanicParser } from '../lib/panic-parser.js';
import { loadConfig } from '../lib/config.js';
import { successResponse, errorResponse } from '../lib/safe-json.js';
const config = loadConfig();
/**
 * Get last panic from logs
 */
export async function stdb_debug_last_panic(dbName, lines = 200) {
    const startTime = Date.now();
    const name = dbName || config.dbName;
    if (!name) {
        return errorResponse('MISSING_DB_NAME', 'Database name required', null, [], Date.now() - startTime);
    }
    try {
        const result = await runCommand('spacetime', ['logs', name, '--lines', lines.toString()], {
            cwd: config.projectRoot,
            timeout: 10000
        });
        if (result.exitCode !== 0) {
            return errorResponse('LOGS_ERROR', 'Failed to fetch logs', { stderr: result.stderr }, [], Date.now() - startTime);
        }
        const panic = PanicParser.parsePanic(result.stdout);
        if (!panic) {
            return successResponse({
                found: false,
                message: 'No panic found in recent logs'
            }, Date.now() - startTime);
        }
        return successResponse({
            found: true,
            panic,
            formatted: PanicParser.formatPanic(panic)
        }, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('DEBUG_ERROR', err.message || 'Failed to get last panic', null, [], Date.now() - startTime);
    }
}
/**
 * Explain an error
 */
export async function stdb_debug_explain_error(errorText) {
    const startTime = Date.now();
    if (!errorText || errorText.length < 5) {
        return errorResponse('INVALID_INPUT', 'Error text is required', null, [], Date.now() - startTime);
    }
    try {
        // Try to parse as panic
        const panic = PanicParser.parsePanic(errorText);
        if (panic) {
            return successResponse({
                type: 'panic',
                explanation: PanicParser.formatPanic(panic),
                panic,
                suggestions: panic.suggestions || []
            }, Date.now() - startTime);
        }
        // Try to parse as build error
        const buildError = PanicParser.parseBuildError(errorText);
        if (buildError) {
            return successResponse({
                type: 'build_error',
                explanation: buildError.message,
                details: buildError,
                suggestions: buildError.suggestions || []
            }, Date.now() - startTime);
        }
        // Generic error handling
        return successResponse({
            type: 'unknown',
            message: 'Could not identify error type',
            raw: errorText.substring(0, 500)
        }, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('EXPLAIN_ERROR', err.message || 'Failed to explain error', null, [], Date.now() - startTime);
    }
}
/**
 * Check server health
 */
export async function stdb_debug_server_health(dbName) {
    const startTime = Date.now();
    const name = dbName || config.dbName;
    if (!name) {
        return errorResponse('MISSING_DB_NAME', 'Database name required', null, [], Date.now() - startTime);
    }
    try {
        // Try to get server info
        const result = await runCommand('spacetime', ['info', name], {
            cwd: config.projectRoot,
            timeout: 10000
        });
        if (result.exitCode === 0) {
            return successResponse({
                healthy: true,
                info: result.stdout,
                db_name: name
            }, Date.now() - startTime);
        }
        // Server might not be running
        return successResponse({
            healthy: false,
            reason: 'Server not running or not accessible',
            db_name: name,
            suggestion: 'Run `spacetime start ' + name + '` to start the server'
        }, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('HEALTH_ERROR', err.message || 'Failed to check server health', null, [], Date.now() - startTime);
    }
}
//# sourceMappingURL=debug.js.map