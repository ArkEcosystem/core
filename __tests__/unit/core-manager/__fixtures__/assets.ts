import { Actions } from "@packages/core-manager/src/contracts";

export class DummyAction implements Actions.Action {
    public name = "dummy";

    public schema = {
        type: "object",
        properties: {
            id: {
                type: "number"
            }
        },
        required: ["id"],
    }

    public async method() {
        return {}
    }
}
