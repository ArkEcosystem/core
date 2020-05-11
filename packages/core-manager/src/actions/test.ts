import { Container } from "@arkecosystem/core-kernel";
import { Actions } from "../contracts"

@Container.injectable()
export class Action implements Actions.Action {
    public name = "test";

    public async execute(params: object): Promise<any> {
        return {
            test: "test"
        }
    }
}
