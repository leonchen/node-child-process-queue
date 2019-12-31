# cp-worker-queue
Simple in-memory execution queue for node child processes.

## Features
* No dependency
* Supports concurrency
* Supports timeout
* Supports insert/append tasks

## Install
```
npm install cp-worker-queue
```

## Usage Example
```
import Queue, { Task } from 'cp-worker-queue';
const queue = new Queue({
  concurrency: 2,
  timeout: 5000,
});

const task: Task = {
  id: 'myTask',
  command: 'myExecFile',
  args: [],
  options: {
    cwd: __dirname,
  },
  cb: (code: number) => {
    console.log('task exits with code', code);
  }
}

queue.appendTask(task);
```

Please checkout [tests](src/index.test.ts) for more examples.
