"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_get_1 = __importDefault(require("lodash.get"));
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
expect.extend({
    toExecuteOnEntry: (machine, transition) => {
        let path = transition.state;
        // For nested states, but only works 1 level deep
        if (transition.state.indexOf(".") !== -1) {
            const slugs = path.split(".");
            path = `${slugs[0]}.states.${slugs[1]}`;
        }
        const state = lodash_get_1.default(machine.states, path);
        const actions = transition.actions.map(action => `"${action}"`).join(", ");
        return {
            // FIXME isNot is necessary to write the right message
            // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
            message: () => `Expected machine to ${this.isNot ? "not " : ""} call actions ${actions} on state "${transition.state}"`,
            pass: lodash_isequal_1.default(state.onEntry.map(action => action.type), transition.actions),
        };
    },
});
//# sourceMappingURL=execute-on-entry.js.map