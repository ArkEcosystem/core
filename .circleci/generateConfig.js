const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const config = require("./configTemplate.json");

const slowPerformance = ['core-json-rpc', 'crypto'];

generateConfig();

function jason(value) {
    return JSON.parse(JSON.stringify(value));
}

function generateConfig() {
    fs.readdir("./packages", (err, packages) => generateYAML({ packages }));
}

function createJob (name, steps, config) {
    const job = jason(config.jobs[name]);

    const testStepIndex = job.steps.findIndex(
        step => typeof step === "object" && step.run && step.run.name === "Test",
    );

    const stepLog = jason(job.steps[9]);
    const stepCoverage = jason(job.steps[10]);

    for (i = 0; i < steps.length; i++) {
        job.steps[testStepIndex + i] = steps[i];
    }

    job.steps.push(stepLog);
    job.steps.push(stepCoverage);

    config.jobs[name.slice(0,-1) + 'slow'] = job;
    config.workflows.build_and_test.jobs.push(name.slice(0,-1) + 'slow');
}

function createSlowJob (name, config) {
    const slowPerformanceSteps = slowPerformance.map(pkg => {
        return {
            run: {
                name: pkg,
                command: `cd ~/ark-core/packages/${pkg} && yarn test:coverage`,
            },
        };
    });

    createJob(name, slowPerformanceSteps, config)
}

function generateYAML(options) {
    // test split
    const packagesSplit = splitPackagesByTestFiles(options.packages, 3);

    for(const [name, job] of Object.entries(config.jobs)) {
        // save cache
        const saveCacheStep = config.jobs[name].steps.find(step => typeof step === "object" && step.save_cache);
        saveCacheStep.save_cache.paths = options.packages
            .map(package => `./packages/${package}/node_modules`)
            .concat("./node_modules");

        const jobs = [
            config.jobs[name],
            jason(config.jobs[name]),
            jason(config.jobs[name]),
        ];

        createSlowJob(name, config)

        jobs.forEach((job, index) => {
            const testStepIndex = job.steps.findIndex(
                step => typeof step === "object" && step.run && step.run.name === "Test",
            );

            const pkgs = packagesSplit[index].map(package => `./packages/${package}/`);

            const steps = pkgs
                .map(pkg => {
                    const name = path.basename(pkg);

                    return {
                        run: {
                            name,
                            command: `cd ~/ark-core/packages/${name} && yarn test:coverage`,
                        },
                    };
                })
                .filter(pkg => {
                    const { scripts } = require(path.resolve(__dirname, `../packages/${pkg.run.name}/package.json`));

                    return Object.keys(scripts).includes("test:coverage");
                });

            const stepLog = job.steps[9];
            const stepCoverage = job.steps[10];

            for (i = 0; i < steps.length; i++) {
                job.steps[testStepIndex + i] = steps[i];
            }

            job.steps.push(stepLog);
            job.steps.push(stepCoverage);

            config.jobs[name.slice(0,-1) + index] = job;
            config.workflows.build_and_test.jobs.push(name.slice(0,-1) + index);
        });
    }

    fs.writeFile(".circleci/config.yml", yaml.safeDump(config), "utf8", err => {
        if (err) console.error(err);
    });
}

function splitPackagesByTestFiles(packages, splitNumber) {
    /* distribute test packages by test files count : start by most files package,
     and distribute package by package in each _packagesSplit_ (not the most effective
     distribution but simple and enough for now) */
    const packagesWithCount = packages.map(package => ({
        package,
        count: countFiles(`packages/${package}/__tests__`, ".test.js"),
    })).filter(item => {
        return !slowPerformance.includes(item.package)
    })

    const packagesSortedByCount = packagesWithCount.sort((pkgA, pkgB) => pkgA.count > pkgB.count);

    const packagesSplit = new Array(splitNumber);
    packagesSortedByCount.forEach((pkg, index) => (packagesSplit[index % splitNumber] = [pkg.package].concat(packagesSplit[index % splitNumber] || [])));

    return packagesSplit;
}

function countFiles(startPath, filter) {
    let count = 0;
    if (!fs.existsSync(startPath)) {
        return;
    }

    var files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            count += countFiles(filename, filter);
        } else if (filename.indexOf(filter) >= 0) {
            count++;
        }
    }

    return count;
}
