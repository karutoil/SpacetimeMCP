/**
 * Workspace Intelligence Tools
 */
import * as fs from 'fs';
import * as path from 'path';
import { runCommand, commandExists } from '../lib/command-runner.js';
import { loadConfig, detectProjectStructure } from '../lib/config.js';
import { successResponse, errorResponse } from '../lib/safe-json.js';
const config = loadConfig();
/**
 * Get workspace summary
 */
export async function workspace_summary() {
    const startTime = Date.now();
    try {
        const projectRoot = config.projectRoot;
        if (!fs.existsSync(projectRoot)) {
            return errorResponse('WORKSPACE_NOT_FOUND', `Project root does not exist: ${projectRoot}`, null, ['workspace.detect_module_path'], Date.now() - startTime);
        }
        // Detect project structure
        const structure = await detectProjectStructure(projectRoot);
        // Check for key files
        const files = {
            cargoToml: fs.existsSync(path.join(projectRoot, 'Cargo.toml')),
            packageJson: fs.existsSync(path.join(projectRoot, 'package.json')),
            libRs: structure.modulePath ? true : fs.existsSync(path.join(projectRoot, 'src', 'lib.rs')),
            mainRs: fs.existsSync(path.join(projectRoot, 'src', 'main.rs')),
            moduleBindings: structure.bindingsPath ? true : fs.existsSync(path.join(projectRoot, 'module_bindings.rs'))
        };
        // List subdirectories
        let subdirs = [];
        try {
            subdirs = fs.readdirSync(projectRoot, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name)
                .filter(n => !n.startsWith('.'));
        }
        catch {
            // Ignore
        }
        // Check spacetime CLI
        const hasSpacetime = await commandExists('spacetime');
        const summary = {
            project_root: projectRoot,
            module_path: structure.modulePath,
            bindings_path: structure.bindingsPath,
            db_name: structure.dbName,
            has_spacetime_cli: hasSpacetime,
            key_files: files,
            subdirectories: subdirs
        };
        return successResponse(summary, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('WORKSPACE_ERROR', err.message || 'Failed to get workspace summary', { stack: err.stack }, [], Date.now() - startTime);
    }
}
/**
 * Search code in workspace
 */
export async function workspace_search_code(pattern) {
    const startTime = Date.now();
    try {
        if (!pattern || pattern.length < 2) {
            return errorResponse('INVALID_PATTERN', 'Search pattern must be at least 2 characters', null, [], Date.now() - startTime);
        }
        const projectRoot = config.projectRoot;
        const result = await runCommand('grep', ['-r', '--include=*.rs', '-l', pattern, projectRoot], {
            timeout: 30000,
            maxOutput: 50000
        });
        const files = result.stdout
            .split('\n')
            .filter(f => f.trim())
            .slice(0, 50);
        return successResponse({
            pattern,
            matches: files,
            count: files.length
        }, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('SEARCH_ERROR', err.message || 'Failed to search code', { pattern }, [], Date.now() - startTime);
    }
}
/**
 * Get git diff summary
 */
export async function workspace_git_diff_summary() {
    const startTime = Date.now();
    try {
        const projectRoot = config.projectRoot;
        const gitDir = path.join(projectRoot, '.git');
        if (!fs.existsSync(gitDir)) {
            return successResponse({
                is_git_repo: false,
                message: 'Not a git repository'
            }, Date.now() - startTime);
        }
        const statusResult = await runCommand('git', ['status', '--porcelain'], {
            cwd: projectRoot,
            timeout: 10000
        });
        const diffResult = await runCommand('git', ['diff', '--stat'], {
            cwd: projectRoot,
            timeout: 10000
        });
        const changes = statusResult.stdout
            .split('\n')
            .filter(l => l.trim())
            .map(l => ({
            status: l.substring(0, 2).trim(),
            file: l.substring(3).trim()
        }));
        return successResponse({
            is_git_repo: true,
            changes,
            diff_summary: diffResult.stdout,
            has_changes: changes.length > 0
        }, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('GIT_ERROR', err.message || 'Failed to get git diff', null, [], Date.now() - startTime);
    }
}
/**
 * Detect module path
 */
export async function workspace_detect_module_path() {
    const startTime = Date.now();
    try {
        const projectRoot = config.projectRoot;
        const structure = await detectProjectStructure(projectRoot);
        if (!structure.modulePath) {
            return errorResponse('MODULE_NOT_FOUND', 'Could not detect SpacetimeDB module source', { searched: ['src/lib.rs', 'src/main.rs'] }, ['workspace.detect_bindings_path'], Date.now() - startTime);
        }
        return successResponse({
            module_path: structure.modulePath,
            detection_method: 'file_exists'
        }, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('DETECTION_ERROR', err.message || 'Failed to detect module path', null, [], Date.now() - startTime);
    }
}
/**
 * Detect bindings path
 */
export async function workspace_detect_bindings_path() {
    const startTime = Date.now();
    try {
        const projectRoot = config.projectRoot;
        const structure = await detectProjectStructure(projectRoot);
        if (!structure.bindingsPath) {
            return errorResponse('BINDINGS_NOT_FOUND', 'Could not detect module bindings', { searched: ['module_bindings.rs', 'target/*/module_bindings.rs'] }, ['stdb.cli.generate_bindings'], Date.now() - startTime);
        }
        return successResponse({
            bindings_path: structure.bindingsPath,
            detection_method: 'file_exists'
        }, Date.now() - startTime);
    }
    catch (err) {
        return errorResponse('DETECTION_ERROR', err.message || 'Failed to detect bindings path', null, [], Date.now() - startTime);
    }
}
//# sourceMappingURL=workspace.js.map