const chokidar = require('chokidar');
const EventEmitter = require('events');
const fs = require('fs');
const os = require('os');

const watcher = Symbol('watcher');
const fd = Symbol('fd');

function closeFile() {
  if (this[td]) {
    fs.close(this[fd], (err) => {
      if (err) {
        return;
      }
      this[td] = undefined;
    });
  }
}

class Tail extends EventEmitter {

  constructor(filename, options) {
    super();
    this.filename = filename;
    this.options = Object.assign(options || {}, {
      alwaysStat: true,
      ignoreInitial: false,
      persistent: true,
    });
    this[watcher] = undefined;
    this[fd] = undefined;
  }

  watch() {
    let lastSize = 0;

    this[watcher] = chokidar.watch(this.filename, this.options)
      .on('add', (path, stats) => {
        lastSize = stats.size;
      })
      .on('change', (path, stats) => {
        const diff = stats.size - lastSize;
        if (diff <= 0) {
          lastSize = stats.size;
          return;
        }
        const buffer = Buffer.alloc(diff);
        this[fd] = fs.openSync(path, 'r');
        fs.read(this[fd], buffer, 0, diff, lastSize, (err) => {
          if (err) {
            return;
          }
          fs.closeSync(this[fd]);
          buffer.toString().split(os.EOL).forEach((line, idx, ar) => {
            if (idx < ar.length && line) {
              this.emit('line', line);
            }
          });
          
        });
        lastSize = stats.size;
      })
      .on('unlink', () => {
        lastSize = 0;
        closeFile.bind(this);
      });
  }

  close() {
    if (this[watcher]) {
      this[watcher].unwatch(this.filename);
      this[watcher].close();
      this[watcher] = undefined;
    }
    this.emit('close');
  }
}

module.exports = Tail;
