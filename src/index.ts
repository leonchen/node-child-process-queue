import { execFile, ExecFileOptions } from 'child_process';

export interface InitParams {
  concurrency?: number;
  timeout?: number;
}

export interface Task {
  id: string;
  command: string;
  args?: string[];
  options?: ExecFileOptions;
  cb?: Function;
}

export default class WorkerQueue {
  private concurrency: number = 1;
  private timeout: number = 60000;
  private runningTasks: Set<string> = new Set();
  private queuedTasks: Task[] = [];

  constructor(params: InitParams) {
    const { concurrency, timeout } = params;
    if (concurrency) this.concurrency = concurrency;
    if (timeout) this.timeout = timeout;
  }

  insertTask(task: Task) {
    const { id } = task;
    if (this.runningTasks.has(id)) return;
    const newQueue = [task];
    for (const t of this.queuedTasks) {
      if (t.id !== id) newQueue.push(t);
    }
    this.queuedTasks = newQueue;
    this.run();
  }

  appendTask(task: Task) {
    const { id } = task;
    if (this.runningTasks.has(id)) return;
    if (this.queuedTasks.find(t => t.id === id)) return;
    this.queuedTasks.push(task);
    this.run();
  }

  run() {
    if (this.queuedTasks.length == 0) return;
    if (this.runningTasks.size >= this.concurrency) return;
    const task = this.queuedTasks.shift();
    this.executeTask(task!);
    this.run();
  }

  executeTask(task: Task) {
    const { id, command, args = [], options = {}, cb } = task;
    let finished = false;
    const finishTask = async (code: number) => {
      this.runningTasks.delete(id);
      if (cb) cb(code);
      this.run();
    };

    this.runningTasks.add(id);
    const cp = execFile(command, args, {
      ...options,
      timeout: this.timeout,
    });
    cp.on('error', async (e: any) => {
      if (finished) return;
      finished = true;
      console.error(`failed to init task ${JSON.stringify([command, ...args])}`, [e]);
      await finishTask(-1);
    });
    cp.on('exit', async (code: number, signal: string) => {
      if (finished) return;
      finished = true;
      if (code !== 0 || signal)
        console.error(`failed to run task ${JSON.stringify([command, ...args])}`, [code, signal]);
      await finishTask(code);
    });
  }

  get runningTaskIds(): string[] {
    return Array.from(this.runningTasks);
  }

  get queuedTaskIds(): string[] {
    return this.queuedTasks.map(t => t.id);
  }
}
