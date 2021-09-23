#!/usr/bin/env node
const inspect = require('../dist/index')

inspect.buildDepTreeFromFiles('./', 'package.json', 'package-lock.json')
  .then((tree) => {
    console.log(JSON.stringify(tree));
  })
  .catch(console.error);
