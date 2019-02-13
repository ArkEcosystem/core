import { Hook, IConfig } from "@oclif/config";
import { shell } from "execa";
import { statSync } from "fs";
import got from "got";
import { join } from "path";
import prompts from "prompts";
import semver from "semver";
import { logger } from "../logger";

async function getVersionFromNode(name: string): Promise<string> {
    const { body } = await got(`https://registry.npmjs.org/${name}`);

    return JSON.parse(body)["dist-tags"].latest;
}

async function getVersionFromGithub(name: string): Promise<string> {
    const { body } = await got(`https://api.github.com/repos/${name.substr(1)}/releases/latest`);

    return JSON.parse(body).tag_name;
}

export function needsRefresh(config: IConfig) {
    const file = join(config.cacheDir, "version");

    try {
        const { mtime } = statSync(file);
        const staleAt = new Date(mtime.valueOf() + 1000 * 60 * 60 * 24 * 1);

        return staleAt < new Date();
    } catch (error) {
        logger.error(error.message);

        return true;
    }
}

export async function checkForUpdates(config) {
    try {
        const remoteVersion = await getVersionFromNode(config.name);

        if (semver.gt(remoteVersion, config.version)) {
            const response = await prompts([
                {
                    type: "confirm",
                    name: "confirm",
                    message: `Version ${remoteVersion} is available. Would you like to update?`,
                },
            ]);

            if (response.confirm) {
                try {
                    const { stdout, stderr } = await shell(`yarn global add ${config.name}`);

                    if (stderr) {
                        console.error(stderr);
                    }

                    console.log(stdout);
                } catch (error) {
                    logger.error(error.message);
                }
            }
        }
    } catch (error) {
        logger.error(error.message);
    }
}
