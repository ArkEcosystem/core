import { Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.resources";

    public schema = {
        type: "object",
        properties: {},
    };

    public async execute(params: { showAllDisks?: boolean }): Promise<any> {
        return {};
    }
}
