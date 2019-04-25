"use strict";

const util = require("util");
const exec = util.promisify(require("child_process").exec);

/**
 * Create a transaction to be added to the pool and shut down the node
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    const commandStopNode = `docker ps --format "{{.Names}}" | grep node1_ark | xargs -I {} sh -c 'docker exec -d {} bash killpid.sh'`; // sending SIGINT for graceful shutdown
    const { stdout, stderr } = await exec(commandStopNode);
    console.log(`[pool-clear] killed node1 process`);
};
