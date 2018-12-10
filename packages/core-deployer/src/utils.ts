import envfile from "envfile";
import expandHomeDir from "expand-home-dir";
import { ensureDirSync, ensureFileSync, existsSync, writeFileSync } from "fs-extra";
import set from "lodash/set";
import { dirname, resolve } from "path";
import { logger } from "./logger";

/**
 * Get a random number from range.
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number}
 */
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min) + min);

/**
 * Update the contents of the given file and return config.
 * @param  {String} file
 * @param  {Object} values
 * @return {Object}
 */
const updateConfig = (file, values, configPath, forceOverwrite: boolean = false) => {
    configPath = configPath || `${process.env.ARK_PATH_CONFIG}/deployer`;
    configPath = resolve(configPath, file);
    let config;
    if (existsSync(configPath) && !forceOverwrite) {
        config = require(configPath);
    } else {
        config = {};
    }

    Object.keys(values).forEach(key => set(config, key, values[key]));

    ensureFileSync(configPath);
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    return config;
};

/**
 * Write Environment variables to file.
 * @param  {Object} object
 * @param  {String} path
 * @return {void}
 */
const writeEnv = (object, filePath) => {
    filePath = expandHomeDir(filePath);
    ensureDirSync(dirname(filePath));
    writeFileSync(filePath, envfile.stringifySync(object));
};

export { getRandomNumber, logger, updateConfig, writeEnv };
