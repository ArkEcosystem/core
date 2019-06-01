const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const config = require("./configTemplate.json");

const fixedJobs = [
    "test-node10-unit",
    "test-node11-unit",
    "test-node12-unit",
    "test-node10-functional",
    "test-node11-functional",
    "test-node12-functional",
    "test-node10-benchmark",
    "test-node11-benchmark",
    "test-node12-benchmark",
    "test-node10-e2e",
    "test-node11-e2e",
    "test-node12-e2e",
]

function jason(value) {
    return JSON.parse(JSON.stringify(value));
}

fs.readdir("./packages", (_, packages) => {
    // test split
    const packagesChunks = splitPackages(packages);

    for (const [name, job] of Object.entries(config.jobs)) {
        // save cache using 2 steps because only 1 step cause circleci issue because of number of paths to save
        const saveCacheIndex = job.steps.findIndex(step => typeof step === "object" && step.save_cache);
        const saveCacheStep1 = job.steps[saveCacheIndex];
        const saveCacheStep2 = {
            save_cache: Object.assign({}, saveCacheStep1.save_cache)
        };
        const pathsToSave = packages
            .map(package => `./packages/${package}/node_modules`)
            .concat("./node_modules")
            .concat("./__tests__/e2e/node_modules");

        saveCacheStep1.save_cache.paths = pathsToSave.slice(0, Math.floor(pathsToSave.length / 2));
        saveCacheStep1.save_cache.key = saveCacheStep1.save_cache.key + "-1";

        saveCacheStep2.save_cache.paths = pathsToSave.slice(Math.floor(pathsToSave.length / 2));
        saveCacheStep2.save_cache.key = saveCacheStep2.save_cache.key + "-2";
        job.steps.splice(saveCacheIndex, 0, saveCacheStep2);

        // restore cache, same as for save cache
        const restoreCacheIndex = job.steps.findIndex(step => typeof step === "object" && step.restore_cache);
        const restoreCacheStep1 = job.steps[restoreCacheIndex];
        const restoreCacheStep2 = {
            restore_cache: Object.assign({}, restoreCacheStep1.restore_cache)
        };

        restoreCacheStep1.restore_cache.key = restoreCacheStep1.restore_cache.key + "-1";
        restoreCacheStep2.restore_cache.key = restoreCacheStep2.restore_cache.key + "-2";
        job.steps.splice(restoreCacheIndex, 0, restoreCacheStep2);

        if (fixedJobs.includes(name)) {
            continue;
        }

        // duplicate base integration jobs
        const jobs = [
            job,
            jason(job),
        ];

        jobs.forEach((job, index) => {
            const testStepIndex = job.steps.findIndex(
                step => typeof step === "object" && step.run && step.run.name === "Unit tests",
            );

            const steps = getIntegrationSteps(packagesChunks[index]);

            const stepLog = jason(job.steps[testStepIndex + 1]);
            const stepLint = jason(job.steps[testStepIndex + 2]);
            const stepCoverage = jason(job.steps[testStepIndex + 3]);

            for (i = 0; i < steps.length; i++) {
                job.steps[testStepIndex + i] = steps[i];
            }

            job.steps.push(stepLog);
            job.steps.push(stepLint);
            job.steps.push(stepCoverage);

            config.jobs[name.slice(0, -1) + index] = job;
            config.workflows.build_and_test.jobs.push(name.slice(0, -1) + index);
        });
    }

    config.workflows.build_and_test.jobs = fixedJobs
        .concat(config.workflows.build_and_test.jobs)

    fs.writeFileSync(".circleci/config.yml", yaml.safeDump(config));
});

function splitPackages(packageNames) {
    // split packages in two for integration tests
    const integrationPackages = packageNames.sort()
        .map(pkg => path.basename(pkg))
        .filter(pkg => fs.existsSync(path.resolve(__dirname, `../__tests__/integration/${pkg}`)))

    var indexToSplit = Math.floor(integrationPackages.length / 2);
    return [
        integrationPackages.slice(0, indexToSplit),
        integrationPackages.slice(indexToSplit)
    ]
}

function getIntegrationSteps(packages) {
    const resetSqlCommand = "cd ~/core/.circleci && ./rebuild-db.sh"

    const steps = []
    steps.push(...packages
        .filter(pkg => fs.existsSync(path.resolve(__dirname, `../__tests__/integration/${pkg}`)))
        .map(pkg => ({
            run: {
                name: `${pkg} - integration`,
                command: `${resetSqlCommand} && cd ~/core && yarn test:coverage /integration/${pkg}/ --coverageDirectory .coverage/integration/${pkg}`,
            },
        }))
    );

    return steps;
}
