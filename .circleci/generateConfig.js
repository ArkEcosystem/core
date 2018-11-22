const yaml = require('js-yaml')
const fs = require('fs')

const config = require('./configTemplate.json')

generateConfig()

function generateConfig() {
  fs.readdir('./packages', (err, packages) => genYaml({ packages }))
}

function genYaml(options) {
  const saveCacheStep = config.jobs['init'].steps.find(
    step => typeof step === 'object' && step.save_cache,
  )
  saveCacheStep.save_cache.paths = options.packages
    .map(package => `./packages/${package}/node_modules`)
    .concat('./node_modules')

  const testJobs = ['test-node10', 'test-node10-2']
  testJobs.forEach((job, index) => {
    const testStep = config.jobs[job].steps.find(
      step => typeof step === 'object' && step.run.name === 'Test',
    )
    const chunkSize = Math.ceil(options.packages.length / 2)
    testStep.run.command = testStep.run.command.replace(
      '{{TESTPATHS}}',
      options.packages
        .map(package => `./packages/${package}`)
        .slice(index * chunkSize, (index + 1) * chunkSize)
        .join(' '),
    )
  })

  fs.writeFile('.circleci/config.yml', yaml.safeDump(config), 'utf8', err => {
    if (err) console.error(err)
  })
}
