import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const tsxCli = path.resolve(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const viteCli = path.resolve(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

const children: ChildProcess[] = [];
let shuttingDown = false;

function startProcess(label: string, args: string[]) {
  const child = spawn(process.execPath, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      shuttingDown = true;
      for (const proc of children) {
        if (proc !== child && !proc.killed) {
          proc.kill('SIGTERM');
        }
      }
      if (signal) {
        process.exit(0);
      }
      process.exit(code ?? 0);
    }
  });

  child.on('error', (err) => {
    console.error(`[${label}] Failed to start:`, err);
    process.exit(1);
  });

  children.push(child);
  return child;
}

startProcess('server', [tsxCli, 'watch', 'server/index.ts']);
startProcess('client', [viteCli, '--port=3000', '--host=0.0.0.0']);

function forwardSignal(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));
