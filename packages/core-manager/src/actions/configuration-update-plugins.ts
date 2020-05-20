import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import requireFromString from "require-from-string";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "configuration.updatePlugins";

    public schema = {
        type: "object",
        properties: {
            content: {
                type: "string",
            },
        },
        required: ["content"],
    };

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public async execute(params: { content: string }): Promise<any> {
        await this.updatePlugins(params.content);

        return {};
    }

    private validatePlugins(content: string): void {
        let pluginsResolved: any = undefined;
        try {
            pluginsResolved = requireFromString(content);
        } catch {}

        if (typeof pluginsResolved !== "object") {
            throw new Error("Content cannot be resolved");
        }

        if (!Object.keys(pluginsResolved).some((key) => key.includes("@arkecosystem/"))) {
            throw new Error("Missing plugin keys");
        }

        if (!Object.keys(pluginsResolved).every((key) => typeof pluginsResolved[key] === "object")) {
            throw new Error(`Plugin is not an object`);
        }
    }

    private async updatePlugins(content: string): Promise<void> {
        this.validatePlugins(content);

        await this.filesystem.put(this.app.configPath("plugins.js"), content);
    }
}
