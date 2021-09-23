const assert = require('assert');
const cluster = require('cluster');
const fs = require('fs');
const path = require('path');
const Tail = require('..');

const filename = path.join(__dirname, 'test.log');

function before() {
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }
  fs.writeFileSync(filename, '');
}

function after() {
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }
}

function startTail(tail) {

  const assertData = [
    'Line #1',
    'Line #2',
    'Line #3',
    'Line #4',
    'Line #5'
  ];
  return new Promise((resolve, reject) => {
    let counter = 0;
    let closeCalled = false;
    tail.on('line', (line) => {
      assert.equal(assertData[counter], line);
      process.stdout.write(`\nLine recieved:\n${line}\n`);
      counter += 1;
    });
    tail.on('close', () => {
      assert.equal(5, counter); 
      closeCalled = true;
      resolve({ counter, closeCalled });
    });
    tail.watch();
  });
}

before();

if (cluster.isMaster) {
  const tail = new Tail(filename);
  startTail(tail).then((data) => {
    // assert
    assert.ok(data.closeCalled);
  }, () => { console.log('er'); });

  // start log emulation in separate process
  cluster.fork();
  cluster.on('exit', (worker, code, signal) => {
    assert.equal(0, code);
    tail.close();
  });

} else {
  // emulate logger
  const TIMEOUT = 1000;
  const testData = [
    'Line #1\n',
    'Line #2\n',
    'Line #3\n',
    'Line #4\nLine #5\n'
  ];

  testData.forEach((item, idx, ar) => {
    setTimeout(() => {
      fs.appendFileSync(filename, item);
      process.stdout.write(`\nWrite to log:\n${item}`);
      if (idx + 1 === ar.length) {
        setTimeout(() => {
          cluster.worker.kill()
        }, TIMEOUT);
      }
    }, TIMEOUT * (idx + 1));
  });
}
