import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
export class BrainClient {
  constructor() {
    this.nextId = 0;
    this.pending = new Map();
    this.child = spawn('.local/connectome-tools/bin/python', ['-m', 'packages.bio_agent.full_apps'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env, OPENBLAS_NUM_THREADS: '1', OMP_NUM_THREADS: '1' },
    });
    this.ready = new Promise((resolve, reject) => {
      this.child.once('error', reject);
      this.child.once('exit', (code) => reject(new Error(`Brain exited during startup: ${code}`)));
      this.onReady = resolve;
    });
    createInterface({ input: this.child.stdout }).on('line', (line) => {
      let data;
      try {
        data = JSON.parse(line);
      } catch {
        this.fail(new Error('Invalid brain response'));
        return;
      }
      if (data.ready) {
        this.onReady(data);
        return;
      }
      const pending = this.pending.get(data.id);
      if (!pending) return;
      this.pending.delete(data.id);
      data.error ? pending.reject(new Error(data.error)) : pending.resolve(data.result);
    });
    this.child.on('exit', (code) => this.fail(new Error(`Brain stopped: ${code}`)));
    this.child.stdin.on('error', (error) => this.fail(error));
  }
  fail(error) {
    for (const item of this.pending.values()) item.reject(error);
    this.pending.clear();
  }
  async call(op, payload = {}) {
    await this.ready;
    if (this.child.exitCode !== null) throw Error('Brain is not running');
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.stdin.write(JSON.stringify({ ...payload, op, id }) + '\n', (error) => {
        if (error) {
          this.pending.delete(id);
          reject(error);
        }
      });
    });
  }
  close() {
    this.child.stdin.end();
  }
}
