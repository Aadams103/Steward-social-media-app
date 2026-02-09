/**
 * Runs "npm run check" with a timeout; used by build (check:safe).
 * Single command string with shell:true avoids Node DEP0190 deprecation.
 */
const { spawn } = require('child_process');

const TIMEOUT_MS = 20000;
const proc = spawn('npm run check', { shell: true });
const timeout = setTimeout(() => {
  proc.kill();
  process.exit(1);
}, TIMEOUT_MS);

proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stderr);

proc.on('exit', (code, signal) => {
  clearTimeout(timeout);
  process.exit(code ?? 0);
});
