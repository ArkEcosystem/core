const yaml = require('js-yaml')
const fs = require('fs')

const config = require('./configTemplate.json')

generateConfig()

function generateConfig() {
  fs.readdir('./packages', (err, packages) => genYaml({ packages }))
}

function genYaml(options) {
  const saveCacheStep = config.jobs['test-node10'].steps.find(
    step => typeof step === 'object' && step.save_cache,
  )
  saveCacheStep.save_cache.paths = options.packages
    .map(package => `./packages/${package}/node_modules`)
    .concat('./node_modules')

  fs.writeFile('.circleci/config.yml', yaml.safeDump(config), 'utf8', err => {
    if (err) console.error(err)
  })
}
