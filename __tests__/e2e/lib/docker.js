"use strict";

const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

/**
 * @return {void}
 */
module.exports = async () => {
    console.log("Start");

    const command = `cd ${path.resolve(__dirname, "../dist")} && ./docker-init.sh && ./docker-start.sh`;
    console.log(`Executing: ${command}`);
    console.log("It can take some time... If you want to see the output please run the command directly on your terminal.")
    await exec(command);

    console.log("Docker done")
};
