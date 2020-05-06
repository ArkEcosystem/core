import { lstatSync, readdirSync } from "fs-extra";
import { resolve } from "path";

import { Container, Application } from "@arkecosystem/core-kernel";
import { Actions } from "./contracts";

@Container.injectable()
export class ActionReader {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public discoverActions(): Actions.Action[] {
        let actions: Actions.Action[] = [];

        let path = resolve(__dirname, "./actions")

        const actionFiles: string[] = readdirSync(path)
            .map((item: string) => `${path}/${item}`)
            .filter((item: string) => lstatSync(item).isFile())
            .filter((item: string) => item.endsWith(".js"));

        for (const file of actionFiles) {
            const actionInstance: Actions.Action = this.app.resolve(require(file).Action);

            actions.push(actionInstance)
        }

        return actions;
    }
}
