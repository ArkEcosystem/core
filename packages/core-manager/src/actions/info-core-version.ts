import { Application, Container } from "@arkecosystem/core-kernel";
import { Actions } from "../contracts"
import latestVersion from "latest-version"

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "info.coreVersion";

    public async execute(params: object): Promise<any> {
        return {
            currentVersion: this.app.version(),
            latestVersion: await this.getLatestVersion()
        }
    }

    private async getLatestVersion(): Promise<string> {
        return latestVersion("@arkecosystem/core");
    }
}
