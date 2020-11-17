import { Application, Container } from "@arkecosystem/core-kernel";
import { readJSONSync } from "fs-extra";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "configuration.getPlugins";

    public async execute(params: object): Promise<any> {
        return readJSONSync(this.app.configPath("app.json"));
    }
}
