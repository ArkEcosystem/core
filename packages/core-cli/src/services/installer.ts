import { sync } from "execa";
import * as semver from "semver";

import { injectable } from "../ioc";

type Package = {
    pkg: string;
    version: string;
};

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

        const { stdout, stderr, exitCode } = sync(`pnpm install -g ${pkg}@${tag}`, { shell: true });

        if (exitCode !== 0) {
            throw new Error(`"pnpm install -g ${pkg}@${tag}" exited with code ${exitCode}\n${stderr}`);
        }

        console.log(stdout);
    }

    public installPeerDependencies(pkg: string, tag: string = "latest"): void {
        const { stdout, stderr, exitCode } = sync(`pnpm info ${pkg}@${tag} peerDependencies --json`, { shell: true });

        if (exitCode !== 0) {
            throw new Error(
                `"pnpm info ${pkg}@${tag} peerDependencies --json" exited with code ${exitCode}\n${stderr}`,
            );
        }

        const installedPackages = this.getInstalled();

        for (const [peerPkg, peerPkgSemver] of Object.entries(stdout !== "" ? JSON.parse(stdout) : {})) {
            const installedPkg = installedPackages.find((installed) => installed.pkg === peerPkg);
            if (!installedPkg || !semver.satisfies(installedPkg.version, peerPkgSemver as string)) {
                this.installRangeLatest(peerPkg, peerPkgSemver as string);
            }
        }
    }

    public installRangeLatest(pkg: string, range: string): void {
        const { stdout, stderr, exitCode } = sync(`pnpm info ${pkg} versions --json`, { shell: true });

        if (exitCode !== 0) {
            throw new Error(`"pnpm info ${pkg} versions --json" exited with code ${exitCode}\n${stderr}`);
        }

        const versions = (stdout !== "" ? (JSON.parse(stdout) as string[]) : [])
            .filter((v) => semver.satisfies(v, range))
            .sort((a, b) => semver.rcompare(a, b));

        if (versions.length === 0) {
            throw new Error(`No ${pkg} version to satisfy ${range}`);
        }

        this.install(pkg, versions[0]);
    }

    private getInstalled(): Package[] {
        const { stdout, stderr, exitCode } = sync(`pnpm list -g --json`, { shell: true });

        if (exitCode !== 0) {
            throw new Error(`"pnpm list -g --json" exited with code ${exitCode}\n${stderr}`);
        }

        if (stdout === "") {
            return [];
        }

        return Object.entries<{ version: string }>(JSON.parse(stdout)[0].dependencies).map(([pkg, meta]) => {
            return {
                pkg,
                version: meta.version,
            };
        });
    }
}
