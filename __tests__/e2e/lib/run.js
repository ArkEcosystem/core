"use strict";

const jest = require("jest");
const delay = require("delay");
const testUtils = require("./utils/test-utils");
const path = require("path");
const fs = require("fs");

/**
 * Run the tests configured
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    console.log("Start");

    await new Runner(options).runTests();
};

class Runner {
    /**
     * Create a new test runner instance.
     * @param  {Object} options
     */
    constructor(options) {
        this.scenario = options.scenario;
        this.failedTestSuites = 0;
        this.rootPath = path.dirname("../");
        this.testResults = [];
        this.startTime = Date.now();
        this.timeLimit = options.timeLimit ? options.timeLimit * 60 * 1000 : 0; // convert timeLimit minutes to millisec
        this.sync = !!options.sync; // full sync mode

        if (!["testnet", "devnet", "mainnet"].includes(options.network)) {
            throw new Error("Base network should be one of testnet, devnet, mainnet");
        }
        this.network = options.network;
    }

    async runTests() {
        console.log("Executing tests...");
        const executeResult = await this.execute();

        // write test results to a file
        fs.writeFileSync(`${this.rootPath}/test-results.log`, JSON.stringify(this.testResults, null, 2), "utf8");

        // Exiting with exit code = 1 if there are some failed tests - can be then picked up by Travis for example
        process.exitCode = this.failedTestSuites > 0 || !executeResult;
    }

    async execute() {
        return this.sync ? this.executeSync() : this.executeTests();
    }

    async executeSync() {
        if (Date.now() - this.startTime > this.timeLimit) {
            return false; // time limit expired
        }

        const nodesHeight = await testUtils.getNodesHeight();
        if (nodesHeight.length > 2 && !!nodesHeight.reduce((prev, curr) => (prev === curr ? curr : false))) {
            // we are synced
            return true;
        } else {
            console.log(`Not synced : heights are ${nodesHeight.join()}`);
        }

        await delay(20 * 1000);

        return this.executeSync();
    }

    async executeTests(blocksDone = []) {
        const configScenario = require(`../tests/scenarios/${this.scenario}/config.js`);
        const enabledTests = configScenario.enabledTests;
        const configAllTests = { events: { newBlock: {} } };

        for (const test of enabledTests) {
            const testConfig = require(`../tests/scenarios/${this.scenario}/${test}/config.js`);

            const testBlockHeights = testConfig.events.newBlock;
            if (testBlockHeights) {
                for (const height of Object.keys(testBlockHeights)) {
                    configAllTests.events.newBlock[height] = configAllTests.events.newBlock[height] || [];
                    configAllTests.events.newBlock[height] = configAllTests.events.newBlock[height].concat(
                        testBlockHeights[height].map(file => `${test}/${file}`),
                    );
                }
            }
        }

        const configuredBlockHeights = Object.keys(configAllTests.events.newBlock);

        let nodesHeight = await testUtils.getNodesHeight();
        if (!nodesHeight || !nodesHeight.length) {
            console.log("Nodes are not up yet, retrying in 10 seconds...");
            await delay(10 * 1000);
            nodesHeight = await testUtils.getNodesHeight();
            if (!nodesHeight || !nodesHeight.length) {
                console.error("Nodes are not up");
                return false;
            }
        }
        const blockHeight = Math.max(...nodesHeight);
        const lastBlockHeight = blocksDone.length ? blocksDone[blocksDone.length - 1].height : blockHeight;
        blocksDone.push({ height: blockHeight, timestamp: Date.now() });

        if (blockHeight > lastBlockHeight) {
            // new block !
            console.log(`New block : ${blockHeight}`);
            const thingsToExecute = configuredBlockHeights.filter(key => key > lastBlockHeight && key <= blockHeight);

            if (Math.max(...configuredBlockHeights) < blockHeight) {
                // Quit if there are no more tests or actions waiting
                return true;
            }

            for (const key of thingsToExecute) {
                const actionsPaths = configAllTests.events.newBlock[key].filter(file => file.indexOf(".action") > 0);
                const testsPaths = configAllTests.events.newBlock[key].filter(file => file.indexOf(".test") > 0);

                if (testsPaths) {
                    for (const testPath of testsPaths) {
                        // now use Jest to launch the tests
                        console.log(`Executing test ${testPath} for block ${blockHeight}`);
                        this.runJestTest(testPath);
                    }
                }

                if (actionsPaths) {
                    for (const actionPath of actionsPaths) {
                        console.log(`Executing action ${actionPath} for block ${blockHeight}`);
                        this.executeAction(actionPath);
                    }
                }
            }
        }

        await delay(2000);

        if (
            blocksDone.length &&
            Date.now() - blocksDone.filter(b => b.height === blockHeight)[0].timestamp > 1000 * 60 * 2
        ) {
            return false; // we stop test execution because now new blocks came in the last 2min
        }
        return this.executeTests(blocksDone);
    }

    runJestTest(path) {
        const options = {
            projects: [__dirname],
            silent: true,
            testPathPattern: ["tests/scenarios/" + this.scenario + "/" + path.replace(/\//g, "\\/")],
            modulePathIgnorePatterns: ["dist/"],
        };

        jest.runCLI(options, options.projects)
            .then(success => {
                console.log(`Test ${path} was run successfully`);
                this.testResults.push(success.results);

                this.failedTestSuites += success.results.numFailedTestSuites;
            })
            .catch(failure => {
                console.error(`Error running test ${path} : ${failure}`);
            });
    }

    executeAction(actionPath) {
        require(`../tests/scenarios/${this.scenario}/${actionPath}`)();
    }
}
