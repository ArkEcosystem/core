'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const GEMFILE_DEFAULT_LOCATION = path.resolve(process.cwd(), 'Gemfile.lock');
const WHITESPACE = /^(\s*)/;
const GEMFILE_KEY_VALUE = /^\s*([^:(]*)\s*\:*\s*(.*)/;
const ORIGINS = ['GEM', 'GIT', 'PATH'];
const RUBY = /^ruby\s(.*)/;

module.exports = {
  interpret,
  parse,
  parseSync
};

function interpret(string, extractMeta) {
  assert(
    typeof string === 'string',
    'gemfile.interpret expects a UTF-8 Gemfile.lock string source.'
  );

  const gemfileMeta = {};

  let line;
  let index = 0;
  let previousWhitespace = -1;
  let keyCount = {};
  let gemfile = {};
  let lines = string.split('\n');
  let stack = [];

  while((line = lines[index++]) !== undefined) {

    // Handle depth stack changes

    let whitespace = WHITESPACE.exec(line)[1].length;

    if (whitespace <= previousWhitespace) {
      let stackIndex = stack.length - 1;

      while(stack[stackIndex] && (whitespace <= stack[stackIndex].depth)) {
        stack.pop();
        stackIndex--;
      }
    }

    // Make note of line's whitespace depth

    previousWhitespace = whitespace;

    // Handle new key/value leaf

    let parts = GEMFILE_KEY_VALUE.exec(line);
    let key = parts[1].trim();
    let value = parts[2] || '';

    if (key) {

      // Handle path traversal

      let level = gemfile;

      for (let stackIndex = 0; stackIndex < stack.length; stackIndex++) {
        if (level[stack[stackIndex].key]) {
          level = level[stack[stackIndex].key];
        }
      }

      // Handle data type inference

      let data = {};

      if (value.indexOf('/') > -1)  {
        data.path = value;
      } else if (value.indexOf('(') > -1) {
        if (value[value.length - 1] === '!') {
          value = value.substring(0, value.length - 1);
          data.outsourced = true;
        }

        if (value[1] !== ')') {
          data.version = value.substring(1, value.length - 1);
        }
      } else if (/\b[0-9a-f]{7,40}\b/.test(value)) {
        data.sha = value;
      }

      // Set key at current level

      // Do not throw away additional top-level key entries
      // e.g. multiple GIT/GEM blocks
      if (level[key]) {
        if (keyCount[key] === undefined) {
          keyCount[key] = 0;
        } else {
          keyCount[key]++;
        }
        level[key + keyCount[key]] = level[key];
      }
      level[key] = data;

      // Push key on stack

      stack.push({key, depth: whitespace});
    }
  }

  let keys = Object.keys(gemfile);

  let hasGemKey = keys.indexOf('GEM') > -1;
  let hasDependenciesKey = keys.indexOf('DEPENDENCIES') > -1;
  let hasPlatformsKey = keys.indexOf('PLATFORMS') > -1;

  if (!hasGemKey || !hasDependenciesKey || !hasPlatformsKey) {
    console.warn([
      'Are you sure this a Gemfile.lock?',
      'If it is, please file an issue on Github: https://github.com/treycordova/gemfile/issues.',
      'Regardless, gemfile parsed whatever you gave it.'
    ].join('\n'));
  }


  if (gemfile['BUNDLED WITH']) {
    gemfile['BUNDLED WITH'] = Object.keys(gemfile['BUNDLED WITH'])[0];
  }

  if (gemfile['RUBY VERSION']) {
    const rawVersion= Object.keys(gemfile['RUBY VERSION'])[0];
    const version = RUBY.exec(rawVersion)[1];
    gemfile['RUBY VERSION'] = version;
  }

  if (extractMeta) {
    gemfileMeta.bundledWith = gemfile['BUNDLED WITH'];
    gemfileMeta.rubyVersion = gemfile['RUBY VERSION'];
    gemfileMeta.platforms = gemfile['PLATFORMS'];
    gemfileMeta.dependencies = gemfile['DEPENDENCIES'];
    gemfileMeta.specs = Object.keys(gemfile)
                              .filter(key =>
                                ORIGINS.some(origin => key.startsWith(origin)))
                              .reduce((specs, key) => {
                                const type = key.match(/[A-Z]+/)[0];
                                const meta = Object.assign({ type }, gemfile[key]);
                                delete meta.specs;
                                Object.assign(specs, Object.keys(gemfile[key].specs).reduce((specs, gem) => {
                                  specs[gem] = Object.assign({}, gemfile[key].specs[gem], meta);
                                  return specs;
                                }, {}));
                                return specs;
                              }, {});
    return gemfileMeta;
  }

  return gemfile;
}

function parse(path, extractMeta) {
  path = typeof path === 'string' ?
    path :
    GEMFILE_DEFAULT_LOCATION;

  return new Promise(function(resolve, reject) {
    let file = fs.readFile(path, {encoding: 'utf8'}, function(error, gemfile) {
      if (error) {
        return reject(`Couldn't find a Gemfile at the specified location: ${path}.`);
      } else {
        return resolve(interpret(gemfile, extractMeta));
      }
    });
  });
}

function parseSync(path, extractMeta) {
  path = typeof path === 'string' ?
    path :
    GEMFILE_DEFAULT_LOCATION;

  return interpret(fs.readFileSync(path, 'utf8'), extractMeta);
}
