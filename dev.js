const { spawn } = require('child_process');

function run(command, args, options = {}) {
  const proc = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
  proc.on('close', code => {
    if (code !== 0) {
      console.error(`Process ${command} exited with code ${code}`);
    }
  });
  return proc;
}

run('npm', ['run', 'dev'], { cwd: 'backend' });
run('npm', ['run', 'dev'], { cwd: 'frontend' });
