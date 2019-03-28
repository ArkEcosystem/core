const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const config = require("./configTemplate.json");

const fixedJobs = [
    "test-node10-unit",
    "test-node11-unit",
    "test-node10-functional",
    "test-node11-functional",
]

function jason(value) {
    return JSON.parse(JSON.stringify(value));
}

fs.readdir("./packages", (_, packages) => {
    // test split
    const packagesChunks = splitPackages(packages);

    for (const [name, job] of Object.entries(config.jobs)) {
        // save cache
        const saveCacheStep = job.steps.find(step => typeof step === "object" && step.save_cache);
        saveCacheStep.save_cache.paths = packages
            .map(package => `./packages/${package}/node_modules`)
            .concat("./node_modules");

        if (fixedJobs.includes(name)) {
            continue;
        }

        // copy base unit jobs (unit tests) to adapt for integration tests
        const jobs = [
            jason(job),
            jason(job),
        ];

        jobs.forEach((job, index) => {
            const testStepIndex = job.steps.findIndex(
                step => typeof step === "object" && step.run && step.run.name === "Unit tests",
            ) + 1;

            const steps = getIntegrationSteps(packagesChunks[index]);

            const stepLog = job.steps[9];
            const stepLint = job.steps[10];
            const stepCoverage = job.steps[11];

            for (i = 0; i < steps.length; i++) {
                job.steps[testStepIndex + i] = steps[i];
            }

            job.steps.push(stepLog);
            job.steps.push(stepLint);
            job.steps.push(stepCoverage);

            config.jobs[name.slice(0, -1) + (index + 1)] = job;
            config.workflows.build_and_test.jobs.push(name.slice(0, -1) + (index + 1));
        });
    }

    config.workflows.build_and_test.jobs = fixedJobs.concat(config.workflows.build_and_test.jobs)

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
        integrationPackages.slice(indexToSplit + 1)
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
