import { Hook } from "@oclif/config";
import { shell } from "execa";
import got from "got";
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

// tslint:disable-next-line:only-arrow-functions
export const init: Hook<"init"> = async function(opts) {
    try {
        const remoteVersion = await getVersionFromNode(opts.config.name);

        if (semver.gt(remoteVersion, opts.config.version)) {
            logger.info(
                `An update is available! You are currently using ${
                    opts.config.version
                } but ${remoteVersion} is available.`,
            );

            const response = await prompts([
                {
                    type: "confirm",
                    name: "confirm",
                    message: "An update is available, would you like to update?",
                    initial: true,
                },
            ]);

            if (response.confirm) {
                try {
                    const { stdout, stderr } = await shell(`yarn global add ${opts.config.name}`);

                    if (stderr) {
                        console.error(stderr);
                    }

                    console.log(stdout);
                } catch (error) {
                    console.log(error);
                }
            }
        }
    } catch (error) {
        logger.error(error.message);
    }
};
