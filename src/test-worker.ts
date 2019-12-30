function runTestTask() {
  const id = process.argv[2];
  const toSleep = parseInt(id);
  if (isNaN(toSleep)) throw new Error('invalid input number');
  setTimeout(() => {
    process.exit();
  }, toSleep);
}

runTestTask();
