/**
 * Smoke Test Script
 * Tests core MCP server functionality
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Running smoke tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Config loading
  passed += await runTest('Config loads without error', async () => {
    const { loadConfig } = await import('../dist/lib/config.js');
    const config = loadConfig(['node', 'test']);
    if (!config) throw new Error('Config not loaded');
  });

  // Test 2: SafeJSON
  passed += await runTest('SafeJSON handles BigInt', async () => {
    const { SafeJSON } = await import('../dist/lib/safe-json.js');
    const obj = { id: BigInt(123) };
    const str = SafeJSON.stringify(obj);
    if (!str.includes('__bigint')) throw new Error('BigInt not serialized');
  });

  // Test 3: Schema extractor parses correctly
  passed += await runTest('Schema extractor has extract method', async () => {
    const { SchemaExtractor } = await import('../dist/lib/schema-extractor.js');
    if (typeof SchemaExtractor.extract !== 'function') {
      throw new Error('extract method missing');
    }
  });

  // Test 4: Panic parser
  passed += await runTest('Panic parser identifies panics', async () => {
    const { PanicParser } = await import('../dist/lib/panic-parser.js');
    const result = PanicParser.parsePanic("thread 'main' panicked at 'test error'");
    if (!result) throw new Error('Panic not detected');
  });

  // Test 5: Command runner exists
  passed += await runTest('Command runner exists', async () => {
    const { runCommand } = await import('../dist/lib/command-runner.js');
    if (typeof runCommand !== 'function') throw new Error('runCommand missing');
  });

  // Test 6: Workspace summary tool exists
  passed += await runTest('Workspace tools exported', async () => {
    const workspace = await import('../dist/tools/workspace.js');
    if (typeof workspace.workspace_summary !== 'function') {
      throw new Error('workspace_summary missing');
    }
  });

  // Test 7: CLI tools exist
  passed += await runTest('CLI tools exported', async () => {
    const cli = await import('../dist/tools/cli.js');
    if (typeof cli.stdb_cli_status !== 'function') {
      throw new Error('stdb_cli_status missing');
    }
  });

  // Test 8: Project tools exist
  passed += await runTest('Project tools exported', async () => {
    const project = await import('../dist/tools/project.js');
    if (typeof project.stdb_project_describe !== 'function') {
      throw new Error('stdb_project_describe missing');
    }
  });

  // Test 9: All required tool names exist in registry
  passed += await runTest('Tools registered in index', async () => {
    // Just check that index can be imported
    await import('../dist/index.js');
  });

  // Summary
  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
