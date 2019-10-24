import { matchesState } from "xstate";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toTransition(transition: object): R;
        }
    }
}

expect.extend({
    toTransition: (machine, transition) => {
        const state = machine.transition(transition.from, transition.on);

        return {
            // FIXME isNot is necessary to write the right message
            // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
            message: () =>
                // @ts-ignore
                `Expected machine to ${this.isNot ? "not" : ""} transition to "${transition.to}" from "${
                    transition.from
                }" on "${transition.on}"`,
            pass: matchesState(transition.to, state.value),
        };
    },
});
