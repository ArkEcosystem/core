"use strict";

const jest = require("jest");
const delay = require("delay");
const testUtils = require("./utils/test-utils");
const path = require("path");
const fs = require("fs");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

/**
 * Run the tests configured
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    console.log("[test-runner] Start");

    await new TestRunner(options).runTests();
};

class TestRunner {
    /**
     * Create a new test runner instance.
     * @param  {Object} options
     */
    constructor(options) {
        this.scenario = options.scenario;
        this.failedTestSuites = 0;
        this.nodes = [];
        this.rootPath = path.dirname("../");
        this.testResults = [];
        this.skipLastNode = !!options.skipLastNode;
        this.startTime = Date.now();
        this.timeLimit = options.timeLimit ? options.timeLimit * 60 * 1000 : 0; // convert timeLimit minutes to millisec
        this.sync = !!options.sync; // full sync mode

        if (!["testnet", "devnet", "mainnet"].includes(options.network)) {
            throw new Error("Base network should be one of testnet, devnet, mainnet");
        }
        this.network = options.network;
    }

    async runTests() {
        console.log("[test-runner] Waiting for node0 to be up on docker...");
        // wait for ark_node0 to be up + lerna.ok file to exist in dist/e2net/node0/
        await this.waitForNodesDocker(1800);

        // get the IP of all nodes to populate peers.json of each node
        console.log("[test-runner] Getting nodes info...");
        await this.getNodesInfo();
        console.log(JSON.stringify(this.nodes, null, 2));

        // launch the other nodes
        console.log("[test-runner] Launching nodes...");
        await this.launchNodes();

        console.log("[test-runner] Executing tests...");
        const executeResult = await this.execute();

        // write test results to a file
        fs.writeFileSync(`${this.rootPath}/test-results.log`, JSON.stringify(this.testResults, null, 2), "utf8");

        // Exiting with exit code = 1 if there are some failed tests - can be then picked up by Travis for example
        process.exitCode = this.failedTestSuites > 0 || !executeResult;
    }

    async getNodesInfo() {
        // we assume there will be no more than 10 nodes
        for (const nodeNumber of Array(10).keys()) {
            const commandNodeUp = `docker ps | grep node${nodeNumber}_ark | grep Up | wc -l`;
            const { stdout: stdoutNodeUp, stderr: stderrNodeUp } = await exec(commandNodeUp);
            if (stdoutNodeUp[0] === "0") {
                return;
            }
            const commandDockerInspectNode = `docker ps --format "{{.Names}}" | grep node${nodeNumber}_ark | xargs docker inspect`;
            const { stdout: stdoutDockerInspect, stderr: stderrDockerInspect } = await exec(commandDockerInspectNode);
            const nodeInspect = JSON.parse(stdoutDockerInspect);
            const nodeIP = nodeInspect[0].NetworkSettings.Networks.nodes.IPAddress;
            this.nodes[nodeNumber] = { name: `node${nodeNumber}`, IP: nodeIP };

            // log IP into a file for possible future use
            const commandLogIP = `echo ${nodeIP} > ${this.rootPath}/dist/node${nodeNumber}/ip.log`;
            await exec(commandLogIP);

            // do the same for postgres
            const commandDockerInspectPostgres = `docker ps --format "{{.Names}}" | grep node${nodeNumber}_postgres | xargs docker inspect`;
            const { stdout: stdoutInspectPostgres, stderr: stderrInspectPostgres } = await exec(
                commandDockerInspectPostgres,
            );
            const postgresInspect = JSON.parse(stdoutInspectPostgres);
            const postgresIP = postgresInspect[0].NetworkSettings.Networks[`node${nodeNumber}backend`].IPAddress;
            this.nodes[nodeNumber].postgresIP = postgresIP;
        }
    }

    async launchNodes() {
        for (let nodeNumber in this.nodes) {
            console.log(`[test-runner] Launching node${nodeNumber}...`);
            const nodeInfos = this.nodes[nodeNumber];

            // we configure for every node one peer being the last node we started
            console.log(`[test-runner] Updating node${nodeNumber} peer list...`);
            const IPPreviousNode = nodeNumber > 0 ? this.nodes[nodeNumber - 1].IP : this.nodes[0].IP; // node0 will have himself as peer, no problem
            const peers = { list: [{ ip: IPPreviousNode, port: 4000 }] };
            fs.writeFile(
                `${this.rootPath}/dist/${nodeInfos.name}/packages/core/bin/config/${this.network}/peers.json`,
                JSON.stringify(peers, null, 2),
                err => {
                    if (err) throw err;
                },
            );

            // adapt postgres config to use postgres ip
            const pluginsPath = `${this.rootPath}/dist/${nodeInfos.name}/packages/core/bin/config/${this.network}/plugins.js`;
            const plugins = fs.readFileSync(pluginsPath, "utf8");
            const pluginsFixed = plugins.replace("process.env.CORE_DB_HOST", `"${nodeInfos.postgresIP}"`);
            fs.writeFileSync(pluginsPath, pluginsFixed);

            if (this.skipLastNode && nodeNumber === this.nodes.length - 1) {
                return;
            }
            // now launch the node, with --network-start for node0
            console.log(`[test-runner] Launching node${nodeNumber}...`);
            const networkStart = nodeNumber > 0 ? "" : "--network-start ";
            console.log(networkStart);
            const commandLaunch = `docker ps --format "{{.Names}}" | grep ${nodeInfos.name}_ark | xargs -I {} sh -c 'docker exec -d {} bash ark.sh'`;
            console.log(`Executing: ${commandLaunch}`);
            await exec(commandLaunch);

            // wait for the node to be ready
            await this.waitForNode(nodeNumber, 180);
        }
    }

    async waitForNodesDocker(retryCount) {
        if (retryCount === 0) throw "Nodes are not up on Docker";
        if (retryCount % 100 === 0) {
            console.log("[wait for nodes up on docker] ..."); // output something once in a while to prevent circleci from stopping
        }

        // check that the first 3 nodes are up, we assume that the others will be up too
        for (let nodeNumber = 0; nodeNumber < 3; nodeNumber++) {
            const commandNodeModuleExists = `ls ${this.rootPath}/dist/node${nodeNumber} | grep lerna.ok | wc -l`;
            const { stdout: stdoutNodeModuleExists, stderr: stderrNodeModuleExists } = await exec(
                commandNodeModuleExists,
            );

            if (stdoutNodeModuleExists[0] !== "1") {
                await delay(1000);
                return await this.waitForNodesDocker(--retryCount);
            }
        }
    }

    async waitForNode(nodeNumber, retryCount) {
        if (retryCount === 0) throw "Node is not responding";

        let response;
        try {
            response = await testUtils.GET("node/status", {}, nodeNumber);
        } catch (e) {}

        if (!response || response.status !== 200) {
            await delay(2000);
            await this.waitForNode(nodeNumber, --retryCount);
        }
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
            console.log(`[test-runner] Not synced : heights are ${nodesHeight.join()}`);
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

        const nodesHeight = await testUtils.getNodesHeight();
        const blockHeight = Math.max(...nodesHeight);
        const lastBlockHeight = blocksDone.length ? blocksDone[blocksDone.length - 1].height : blockHeight;
        blocksDone.push({ height: blockHeight, timestamp: Date.now() });

        if (blockHeight > lastBlockHeight) {
            // new block !
            console.log(`[test-runner] New block : ${blockHeight}`);
            const thingsToExecute = configuredBlockHeights.filter(key => key > lastBlockHeight && key <= blockHeight);

            if (Math.max(...configuredBlockHeights) < blockHeight) {
                // Quit if there are no more tests or actions waiting
                return true;
            }

            thingsToExecute.forEach(key => {
                const actionsPaths = configAllTests.events.newBlock[key].filter(file => file.indexOf(".action") > 0);
                const testsPaths = configAllTests.events.newBlock[key].filter(file => file.indexOf(".test") > 0);

                if (testsPaths) {
                    testsPaths.forEach(testPath => {
                        // now use Jest to launch the tests
                        console.log(`[test-runner] Executing test ${testPath} for block ${blockHeight}`);
                        this.runJestTest(testPath);
                    });
                }

                if (actionsPaths) {
                    actionsPaths.forEach(actionPath => {
                        console.log(`[test-runner] Executing action ${actionPath} for block ${blockHeight}`);
                        this.executeAction(actionPath);
                    });
                }
            });
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
                console.log(`[test-runner] Test ${path} was run successfully`);
                this.testResults.push(success.results);

                this.failedTestSuites += success.results.numFailedTestSuites;
            })
            .catch(failure => {
                console.error(`[test-runner] Error running test ${path} : ${failure}`);
            });
    }

    executeAction(actionPath) {
        require(`../tests/scenarios/${this.scenario}/${actionPath}`)();
    }
}
