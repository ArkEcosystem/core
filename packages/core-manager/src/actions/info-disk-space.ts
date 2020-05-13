import { Container } from "@arkecosystem/core-kernel";
import df from "@sindresorhus/df";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.diskSpace";

    public schema = {
        type: "object",
        properties: {
            showAllDisks: {
                type: "boolean",
            },
        },
    };

    public async execute(params: { showAllDisks?: boolean }): Promise<any> {
        return await this.getFreeDiskSpace(params.showAllDisks);
    }

    private async getFreeDiskSpace(showAllDisks: boolean = false): Promise<any> {
        if (showAllDisks) {
            return df();
        }
        return df.file(__dirname);
    }
}
