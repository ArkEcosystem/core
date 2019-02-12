import { Hook } from "@oclif/config";
import got from "got";
import semver from "semver";
import { logger } from "../logger";

// tslint:disable-next-line:only-arrow-functions
export const init: Hook<"init"> = async function(opts) {
    try {
        const { body } = await got("https://api.github.com/repos/ArkEcosystem/core/releases/latest");

        const remoteVersion: string = JSON.parse(body).tag_name;

        if (semver.gt(remoteVersion, opts.config.version)) {
            logger.info(
                `An update is available! You are currently using ${
                    opts.config.version
                } but ${remoteVersion} is available.`,
            );
        }
    } catch (error) {
        logger.error(error.message);
    }
};
