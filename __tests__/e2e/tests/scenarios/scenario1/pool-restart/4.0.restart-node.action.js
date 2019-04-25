"use strict";

const util = require("util");
const exec = util.promisify(require("child_process").exec);

/**
 * Restart the node
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    const debug2 = `ps aux | grep ark`; // TODO remove
    const { stdout: debug2Out } = await exec(debug2);
    console.log(`[pool-clear] ${debug2} result : ${debug2Out}`);

    const commandReconnectNode = `docker network connect nodes $(docker ps --format "{{.Names}}" | grep node1_ark) --alias node1 --ip $(cat dist/node1/ip.log)`;
    const { stdout: stdoutReconnect, stderr: stderrReconnect } = await exec(commandReconnectNode);
    console.log(`[pool-clear] reconnect node : ${JSON.stringify({ stdoutReconnect, stderrReconnect })}`);

    const commandLaunch = `docker ps --format "{{.Names}}" | grep node1_ark | xargs -I {} sh -c 'docker exec -d {} bash ark.sh'`;
    console.log(`[pool-clear] Restarting node1`);
    const { stdout, stderr } = await exec(commandLaunch);
    console.log(`[pool-clear] Start node1 result : ${JSON.stringify({ stdout, stderr })}`);
};
