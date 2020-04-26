import { Utils } from "@arkecosystem/core-kernel";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toExecuteOnEntry(transition: object): R;
        }
    }
}

expect.extend({
    toExecuteOnEntry: (machine, transition) => {
        let path = transition.state;

        // For nested states, but only works 1 level deep
        if (transition.state.indexOf(".") !== -1) {
            const slugs = path.split(".");
            path = `${slugs[0]}.states.${slugs[1]}`;
        }

        const state: any = Utils.get(machine.states, path);

        const actions = transition.actions.map((action) => `"${action}"`).join(", ");

        return {
            // FIXME isNot is necessary to write the right message
            // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
            message: /* istanbul ignore next */ () =>
                // @ts-ignore
                `Expected machine to ${this.isNot ? "not " : ""} call actions ${actions} on state "${
                    transition.state
                }"`,
            pass: Utils.isEqual(
                state.onEntry.map((action) => action.type),
                transition.actions,
            ),
        };
    },
});
