import { Actions } from "@packages/core-manager/src/contracts";

export class DummyAction implements Actions.Action {
    public name = "dummy";

    public schema = {
        type: "object",
        properties: {
            id: {
                type: "number",
            },
        },
        required: ["id"],
    };

    public async execute() {
        return {};
    }
}

let dummyAction = new DummyAction();

export const dummyMethod: Actions.Method = {
    name: dummyAction.name,
    schema: dummyAction.schema,

    async method(params) {
        return dummyAction.execute();
    },
};
