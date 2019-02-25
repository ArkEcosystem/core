const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const chunk = require("lodash.chunk");

const config = require("./configTemplate.json");

function jason(value) {
    return JSON.parse(JSON.stringify(value));
}

fs.readdir("./packages", (_, packages) => {
    // test split
    const packagesSplit = chunk(packages.sort(), 10);

    const resetSqlCommand = "cd ~/core/.circleci && ./rebuild-db.sh"

    for (const [name, job] of Object.entries(config.jobs)) {
        // save cache
        const saveCacheStep = config.jobs[name].steps.find(step => typeof step === "object" && step.save_cache);
        saveCacheStep.save_cache.paths = packages
            .map(package => `./packages/${package}/node_modules`)
            .concat("./node_modules");

        const jobs = [
            config.jobs[name],
            jason(config.jobs[name]),
            jason(config.jobs[name]),
        ];

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
                            command: `${resetSqlCommand} && cd ~/core/__tests__/unit/${name} && yarn test:coverage`,
                        },
                    };
                })
                .filter(pkg => {
                    const {
                        scripts
                    } = require(path.resolve(__dirname, `../packages/${pkg.run.name}/package.json`));

                    return Object.keys(scripts).includes("test:coverage");
                });

            const stepLog = job.steps[9];
            const stepLint = job.steps[10];
            const stepCoverage = job.steps[11];

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

    fs.writeFileSync(".circleci/config.yml", yaml.safeDump(config));
});
