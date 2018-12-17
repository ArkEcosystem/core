import axios from "axios";
import dayjs from "dayjs-ext";
import getRepoInfo from "git-repo-info";
import latestVersion from "latest-version";
import prompts from "prompts";
import semver from "semver";

async function performUpdate(options, callback) {
    const response = await prompts([
        {
            type: "confirm",
            name: "confirm",
            message: "A new version is available, would you like to update now?",
            initial: true,
        },
    ]);

    if (response.confirm) {
        callback(options);
    }
}

export async function update(options) {
    const baseUrl = "https://api.github.com/repos/ArkEcosystem/core";

    if (options.network === "mainnet") {
        const latestRelease = await latestVersion("@arkecosystem/core");

        if (semver.gt(latestRelease, options.parent._version)) {
            return performUpdate(options, () => {
                // update via yarn
            });
        }
    } else {
        const response = await axios.get(`https://api.github.com/repos/ArkEcosystem/core/commits`);
        const lastCommit = dayjs(response.data[0].commit.author.date);
        const currentCommit = dayjs(getRepoInfo().authorDate);

        if (lastCommit.isAfter(currentCommit)) {
            return performUpdate(options, () => {
                // update via git
            });
        }
    }
}
