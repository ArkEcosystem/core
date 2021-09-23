"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xstate_1 = require("xstate");
expect.extend({
    toTransition: (machine, transition) => {
        const state = machine.transition(transition.from, transition.on);
        return {
            // FIXME isNot is necessary to write the right message
            // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
            message: () => `Expected machine to ${this.isNot ? "not" : ""} transition to "${transition.to}" from "${transition.from}" on "${transition.on}"`,
            pass: xstate_1.matchesState(transition.to, state.value),
        };
    },
});
//# sourceMappingURL=transition.js.map