'use strict'

const prompts = require('prompts')
const glob = require('tiny-glob')
const Tail = require('tail').Tail
const path = require('path')
const { onCancel } = require('../../utils')
const expandHomeDir = require('expand-home-dir')

module.exports = async () => {
  const choices = await glob('logs/**/*.log', {
    cwd: expandHomeDir('~/.ark'),
    absolute: true,
    filesOnly: true
  })

  const response = await prompts([{
    type: 'select',
    name: 'file',
    message: 'Pick a log',
    choices: choices.map(f => ({ title: path.basename(f), value: f }))
  }], { onCancel })

  if (response.file) {
    const tail = new Tail(response.file)
    tail.on('line', (data) => console.log(data))
  }
}
