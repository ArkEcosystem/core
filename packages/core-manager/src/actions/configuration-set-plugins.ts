import { Application, Container } from "@arkecosystem/core-kernel";
import { writeJSONSync } from "fs-extra";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "configuration.setPlugins";

    public async execute(params: any): Promise<any> {
        await this.updatePlugins(params);

        return {};
    }

    private validatePlugins(params: any): void {
        if (typeof params !== "object") {
            throw new Error("Content cannot be resolved");
        }

        for (const application of Object.keys(params)) {
            if (!Array.isArray(params[application].plugins)) {
                throw new Error(`${application} plugins array is missing`);
            }

            if (!params[application].plugins.every((x) => typeof x.package === "string")) {
                throw new Error(`Package is not a string`);
            }
        }
    }

    private async updatePlugins(params: string): Promise<void> {
        this.validatePlugins(params);

        await writeJSONSync(this.app.configPath("app.json"), params, { spaces: 4 });
    }
}
