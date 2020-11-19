import { Application, Container } from "@arkecosystem/core-kernel";
import latestVersion from "latest-version";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "info.coreVersion";

    public async execute(params: object): Promise<any> {
        return {
            currentVersion: this.app.version(),
            latestVersion: await this.getLatestVersion(),
        };
    }

    private async getLatestVersion(): Promise<string> {
        return latestVersion("@arkecosystem/core", {
            version: this.getChannel(),
        });
    }

    private getChannel(): string {
        const channels: string[] = ["alpha", "beta", "rc", "next"];

        let channel = "latest";
        for (const item of channels) {
            if (this.app.version().includes(`-${item}`)) {
                channel = item;
            }
        }

        return channel;
    }
}
