import { Application, Container, Contracts } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "configuration.setPlugins";

    public schema = {
        type: "object",
        properties: {
            content: {
                type: "string",
            },
        },
        required: ["content"],
    };

    public async execute(params: { content: string }): Promise<any> {
        await this.updatePlugins(params.content);

        return {};
    }

    private validatePlugins(content: string): void {
        let plugins: any = undefined;
        try {
            plugins = JSON.parse(content);
        } catch {}

        if (typeof plugins !== "object") {
            throw new Error("Content cannot be resolved");
        }

        for (const application of Object.keys(plugins)) {
            if (!Array.isArray(plugins[application].plugins)) {
                throw new Error(`${application} plugins array is missing`);
            }

            if (!plugins[application].plugins.every((x) => typeof x.package === "string")) {
                throw new Error(`Package is not a string`);
            }
        }
    }

    private async updatePlugins(content: string): Promise<void> {
        this.validatePlugins(content);

        await this.filesystem.put(this.app.configPath("app.json"), content);
    }
}
