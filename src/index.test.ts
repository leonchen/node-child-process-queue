import * as path from 'path';
import { expect } from 'chai';
import Queue, { Task } from './index';

const ROOT_DIR = path.join(__dirname, '../');
const TEST_WORKER = 'scripts/test-worker';
const NON_EXIST_TEST_WORKER = 'scripts/non-exist-test-worker';

const queue = new Queue({
  concurrency: 2,
  timeout: 5000,
});

async function delay(ms: number) {
  return new Promise(res => {
    setTimeout(res, ms);
  });
}

describe('Worker Queue', () => {
  const exitCodes: Record<string, number> = {};
  const task: Task = {
    id: 't1',
    command: TEST_WORKER,
    args: ['500'],
    options: {
      cwd: ROOT_DIR,
    },
    cb: (code: number) => {
      exitCodes['t1'] = code;
    },
  };

  it('should run workers', async () => {
    queue.appendTask(task);
    await delay(1000);
    expect(exitCodes[task.id]).to.eql(0);
  });

  it('should return error for non-exist command', async () => {
    const t = {
      ...task,
      id: 't2',
      cb: (code: number) => {
        exitCodes['t2'] = code;
      },
    };
    t.command = NON_EXIST_TEST_WORKER;
    queue.appendTask(t);
    await delay(1000);
    expect(exitCodes[t.id]).to.eql(-1);
  });

  it('should return error failed command', async () => {
    const t = {
      ...task,
      id: 't3',
      cb: (code: number) => {
        exitCodes['t3'] = code;
      },
    };
    t.command = TEST_WORKER;
    t.args = ['aaa'];
    queue.appendTask(t);
    await delay(1000);
    expect(exitCodes[t.id]).not.to.eql(0);
  });

  it('should not re-queue same task', async () => {
    const t = {
      ...task,
      id: 't0',
      cb: (code: number) => {
        exitCodes['t0'] = code;
      },
    };
    queue.appendTask(t);
    queue.appendTask(t);
    await delay(400);
    expect(queue.runningTaskIds.length).to.eql(1);
    expect(queue.runningTaskIds[0]).to.eql(t.id);
    expect(queue.queuedTaskIds.length).to.eql(0);
    await delay(600);
    expect(queue.runningTaskIds.length).to.eql(0);
    expect(exitCodes[t.id]).to.eql(0);
  });

  it('should run tasks in parallel', async () => {
    const t1 = {
      ...task,
      id: 'pt1',
      cb: (code: number) => {
        exitCodes['pt1'] = code;
      },
    };
    const t2 = {
      ...task,
      id: 'pt2',
      cb: (code: number) => {
        exitCodes['pt2'] = code;
      },
    };
    const t3 = {
      ...task,
      id: 'pt3',
      cb: (code: number) => {
        exitCodes['pt3'] = code;
      },
    };
    queue.appendTask(t1);
    queue.appendTask(t2);
    queue.appendTask(t3);
    await delay(400);
    expect(queue.runningTaskIds.length).to.eql(2);
    expect(queue.queuedTaskIds.length).to.eql(1);
    expect(queue.queuedTaskIds[0]).to.eql(t3.id);
    await delay(1500);
    expect(queue.runningTaskIds.length).to.eql(0);
    expect(queue.queuedTaskIds.length).to.eql(0);
    expect(exitCodes[t1.id]).to.eql(0);
    expect(exitCodes[t2.id]).to.eql(0);
    expect(exitCodes[t3.id]).to.eql(0);
  });

  it('should run immediate task first', async () => {
    const t1 = {
      ...task,
      id: 'it1',
      cb: (code: number) => {
        exitCodes['it1'] = code;
      },
    };
    const t2 = {
      ...task,
      id: 'it2',
      cb: (code: number) => {
        exitCodes['it2'] = code;
      },
    };
    const t3 = {
      ...task,
      id: 'it3',
      cb: (code: number) => {
        exitCodes['it3'] = code;
      },
    };
    const t4 = {
      ...task,
      id: 'it4',
      cb: (code: number) => {
        exitCodes['it4'] = code;
      },
    };
    queue.appendTask(t1);
    queue.appendTask(t2);
    queue.appendTask(t3);
    queue.insertTask(t4);
    await delay(400);
    expect(queue.queuedTaskIds.length).to.eql(2);
    expect(queue.queuedTaskIds[0]).to.eql(t4.id);
    await delay(1500);
    expect(queue.runningTaskIds.length).to.eql(0);
    expect(queue.queuedTaskIds.length).to.eql(0);
    expect(exitCodes[t1.id]).to.eql(0);
    expect(exitCodes[t2.id]).to.eql(0);
    expect(exitCodes[t3.id]).to.eql(0);
    expect(exitCodes[t4.id]).to.eql(0);
  });
});
