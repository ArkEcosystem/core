import { lstatSync, readdirSync } from "fs-extra";
import { resolve } from "path";

import { Container, Application } from "@arkecosystem/core-kernel";
import { Actions } from "./contracts";
import { ActionAlreadyExistsException, ActionNotFoundException } from "./exceptions/action-registry";

@Container.injectable()
export class ActionRegistry {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    private actions: Map<string, Actions.Action> = new Map<string, Actions.Action>();

    @Container.postConstruct()
    public initialize(): void {
        this.discoverActions(resolve(__dirname, "./actions"))
    }

    public getAction(name: string): Actions.Action {
        if (this.actions.has(name)) {
            return this.actions.get(name)!;
        }

        throw new ActionNotFoundException(name);
    }

    public registerAction(action: Actions.Action) {
        if(this.actions.has(action.name)) {
            throw new ActionAlreadyExistsException(action.name);
        }

        this.actions.set(action.name, action)
    }

    private discoverActions(path: string) {
        const actionFiles: string[] = readdirSync(path)
            .map((item: string) => `${path}/${item}`)
            .filter((item: string) => lstatSync(item).isFile())
            .filter((item: string) => item.endsWith(".js"));

        for (const file of actionFiles) {
            const actionInstance: Actions.Action = this.app.resolve(require(file).Action);

            this.registerAction(actionInstance);
        }
    }
}
