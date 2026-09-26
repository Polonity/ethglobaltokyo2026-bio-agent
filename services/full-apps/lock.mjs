import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
// One writer owns chain configuration, strategy state and the experiment store at a time.
export function acquireExperimentLock(path = '.local/full-apps/experiment.lock') {
  mkdirSync(dirname(path), { recursive: true });
  const token = randomUUID();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      writeFileSync(
        path,
        JSON.stringify({ schema: 'bioagent.experiment-lock.v1', pid: process.pid, token }),
        { flag: 'wx' },
      );
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let old;
      try {
        old = JSON.parse(readFileSync(path, 'utf8'));
      } catch {
        throw Error('Experiment lock is unreadable; inspect it before retrying');
      }
      if (old.schema !== 'bioagent.experiment-lock.v1' || !Number.isSafeInteger(old.pid) || old.pid <= 0)
        throw Error('Unrecognized experiment lock');
      try {
        process.kill(old.pid, 0);
      } catch (e) {
        if (e.code === 'ESRCH') {
          unlinkSync(path);
          continue;
        }
        throw e;
      }
      throw Error(
        `Another full-app process owns the experiment (PID ${old.pid}); finish it before starting this one`,
      );
    }
  }
  if (JSON.parse(readFileSync(path, 'utf8')).token !== token)
    throw Error('Experiment lock acquisition failed');
  return () => {
    try {
      if (JSON.parse(readFileSync(path, 'utf8')).token === token) unlinkSync(path);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  };
}
