import { lstatSync, readdirSync } from "fs-extra";
import { resolve } from "path";

import { Container, Application } from "@arkecosystem/core-kernel";
import { Actions } from "./contracts";

@Container.injectable()
export class ActionReader {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public discoverActions(): Actions.Method[] {
        let methods: Actions.Method[] = [];

        let path = resolve(__dirname, "./actions")

        const actionFiles: string[] = readdirSync(path)
            .map((item: string) => `${path}/${item}`)
            .filter((item: string) => lstatSync(item).isFile())
            .filter((item: string) => item.endsWith(".js"));

        /* istanbul ignore next */
        for (const file of actionFiles) {
            const actionInstance: Actions.Action = this.app.resolve(require(file).Action);

            methods.push(this.prepareMethod(actionInstance))
        }

        return methods;
    }

    /* istanbul ignore next */
    private prepareMethod(action: Actions.Action): Actions.Method {
        return {
            name: action.name,
            method: async (params) => {
                return action.execute(params)
            },
            schema: action.schema
        }
    }
}
