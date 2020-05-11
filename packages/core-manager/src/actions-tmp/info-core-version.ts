import { Application, Container } from "@arkecosystem/core-kernel";
import { Actions } from "../contracts"

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "info.coreVersion";

    public async execute(params: object): Promise<any> {
        return {
            version: this.app.version()
        }
    }
}
