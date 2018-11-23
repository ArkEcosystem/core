const yaml = require('js-yaml')
const fs = require('fs')

const config = require('./configTemplate.json')

generateConfig()

function generateConfig() {
  fs.readdir('./packages', (err, packages) => genYaml({ packages }))
}

function genYaml(options) {
  // save cache
  const saveCacheStep = config.jobs['test-node10-0'].steps.find(
    step => typeof step === 'object' && step.save_cache,
  )
  saveCacheStep.save_cache.paths = options.packages
    .map(package => `./packages/${package}/node_modules`)
    .concat('./node_modules')

  // test split
  const jobs = [
    config.jobs['test-node10-0'],
    JSON.parse(JSON.stringify(config.jobs['test-node10-0'])),
    JSON.parse(JSON.stringify(config.jobs['test-node10-0'])),
  ]

  jobs.forEach((job, index) => {
    const testStep = job.steps.find(
      step => typeof step === 'object' && step.run && step.run.name === 'Test',
    )
    testStep.run.command = testStep.run.command.replace(
      '{{TESTPATHS}}',
      options.packages
        .map(package => `./packages/${package}`)
        .filter((pkg, indexPkg) => (index + indexPkg) % jobs.length === 0)
        .join(' '),
    )

    config.jobs[`test-node10-${index}`] = job
    config.workflows.test_depcheck_lint.jobs.push(`test-node10-${index}`)
  })

  fs.writeFile('.circleci/config.yml', yaml.safeDump(config), 'utf8', err => {
    if (err) console.error(err)
  })
}
