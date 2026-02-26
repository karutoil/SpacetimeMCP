/**
 * Cargo / Build Tools
 */
import { runCommand } from '../lib/command-runner.js';
import { loadConfig } from '../lib/config.js';
import { successResponse, errorResponse } from '../lib/safe-json.js';
const config = loadConfig();
/**
 * Run cargo check
 */
export async function dev_cargo_check() {
    const startTime = Date.now();
    try {
        const result = await runCommand('cargo', ['check'], {
            cwd: config.projectRoot,
            timeout: 300000,
            maxOutput: 500000
        });
        if (result.exitCode === 0) {
            return successResponse({
                passed: true,
                output: result.stdout
            }, Date.now() - startTime);
        }
        // Parse errors
        const errors = [];
        const lines = result.stderr.split('\n');
        let currentError = null;
        for (const line of lines) {
            const match = line.match(/^error\[E\d+\]:\s*(.+)$/);
            if (match) {
                if (currentError)
                    errors.push(currentError);
                currentError = { message: match[1], details: [] };
            }
            else if (currentError && line.trim()) {
                currentError.details.push(line.trim());
            }
        }
        if (currentError)
            errors.push(currentError);
        return errorResponse('CARGO_CHECK_FAILED', 'Cargo check found errors', {
            errors,
            full_output: result.stderr.substring(0, 5000)
        }, [], Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('CARGO_ERROR', err.message || 'Failed to run cargo check', null, [], Date.now() - startTime);
    }
}
/**
 * Run cargo test
 */
export async function dev_cargo_test() {
    const startTime = Date.now();
    try {
        const result = await runCommand('cargo', ['test', '--', '--nocapture'], {
            cwd: config.projectRoot,
            timeout: 300000,
            maxOutput: 1000000
        });
        const passed = result.exitCode === 0;
        // Parse test results
        const testPattern = /test\s+(\w+)\s+\.\.\.\s+(ok|FAILED)/g;
        const tests = [];
        let match;
        while ((match = testPattern.exec(result.stdout + result.stderr)) !== null) {
            tests.push({
                name: match[1],
                passed: match[2] === 'ok'
            });
        }
        return successResponse({
            passed,
            tests,
            summary: passed ? 'All tests passed' : 'Some tests failed',
            output: (result.stdout + result.stderr).substring(0, 5000)
        }, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('CARGO_TEST_ERROR', err.message || 'Failed to run cargo test', null, [], Date.now() - startTime);
    }
}
//# sourceMappingURL=dev.js.map