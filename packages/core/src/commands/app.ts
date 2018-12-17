import axios from "axios";
import dayjs from "dayjs-ext";
import getRepoInfo from "git-repo-info";
import semver from "semver";

export async function update(options) {
    const baseUrl = "https://api.github.com/repos/ArkEcosystem/core";

    if (options.network === "mainnet") {
        const response = await axios.get(`${baseUrl}/releases/latest`);
        const latestRelease = response.data.tag_name;

        if (semver.gt(latestRelease, options.parent._version)) {
            // update available...
        }
    } else {
        const response = await axios.get(`${baseUrl}/commits`);
        const lastCommit = dayjs(response.data[0].commit.author.date);
        const currentCommit = dayjs(getRepoInfo().authorDate);

        if (lastCommit.isAfter(currentCommit)) {
            // update available...
        }
    }
}
