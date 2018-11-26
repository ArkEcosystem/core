const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

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
  const packagesSplit = splitPackagesByTestFiles(options.packages, 3)

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
      packagesSplit[index].map(package => `./packages/${package}/`).join(' '),
    )

    config.jobs[`test-node10-${index}`] = job
    config.workflows.test_depcheck_lint.jobs.push(`test-node10-${index}`)
  })

  fs.writeFile('.circleci/config.yml', yaml.safeDump(config), 'utf8', err => {
    if (err) console.error(err)
  })
}

function splitPackagesByTestFiles(packages, splitNumber) {
  /* distribute test packages by test files count : start by most files package,
     and distribute package by package in each _packagesSplit_ (not the most effective
     distribution but simple and enough for now) */
  const packagesWithCount = packages.map(package => ({
    package,
    count: countFiles(`packages/${package}/__tests__`, '.test.js'),
  }))
  const packagesSortedByCount = packagesWithCount.sort(
    (pkgA, pkgB) => pkgA.count > pkgB.count,
  )

  const packagesSplit = new Array(splitNumber)
  packagesSortedByCount.forEach(
    (pkg, index) =>
      (packagesSplit[index % splitNumber] = [pkg.package].concat(
        packagesSplit[index % splitNumber] || [],
      )),
  )

  return packagesSplit
}

function countFiles(startPath, filter) {
  let count = 0
  if (!fs.existsSync(startPath)) {
    return
  }

  var files = fs.readdirSync(startPath)
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i])
    const stat = fs.lstatSync(filename)
    if (stat.isDirectory()) {
      count += countFiles(filename, filter)
    } else if (filename.indexOf(filter) >= 0) {
      count++
    }
  }

  return count
}
