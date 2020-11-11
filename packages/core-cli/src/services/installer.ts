import { sync } from "execa";
import * as semver from "semver";

import { injectable } from "../ioc";

/**
 * @export
 * @class Installer
 */
@injectable()
export class Installer {
    /**
     * @param {string} pkg
     * @memberof Installer
     */
    public install(pkg: string, tag: string = "latest"): void {
        this.installPeerDependencies(pkg, tag);

        const { stdout, stderr, exitCode } = sync(`yarn global add ${pkg}@${tag}`, { shell: true });

        if (exitCode !== 0) {
            throw new Error(stderr);
        }

        console.log(stdout);
    }

    public installPeerDependencies(pkg: string, tag: string = "latest"): void {
        const { stdout, stderr, exitCode } = sync(`yarn info ${pkg}@${tag} peerDependencies --json`, { shell: true });

        if (exitCode !== 0) {
            throw new Error(stderr);
        }

        for (const [peerPkg, peerPkgSemver] of Object.entries(JSON.parse(stdout) || {})) {
            this.installVersion(peerPkg, peerPkgSemver as string);
        }
    }

    public installVersion(pkg: string, range: string): void {
        const { stdout, stderr, exitCode } = sync(`yarn info ${pkg} versions --json`, { shell: true });

        if (exitCode !== 0) {
            throw new Error(stderr);
        }

        const versions = (JSON.parse(stdout) as string[])
            .filter((v) => semver.satisfies(v, range))
            .sort((a, b) => semver.rcompare(a, b));

        if (versions.length === 0) {
            throw new Error(`No ${pkg} version to satisfy ${range}`);
        }

        this.install(pkg, versions[0]);
    }
}
