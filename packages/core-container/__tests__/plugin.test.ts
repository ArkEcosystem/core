import * as Hapi from "hapi";
import "jest-extended";

import { Application } from "../src/application";
import { AbstractPlugin } from "../src/plugin";
import { Plugin } from "./__stubs__/plugin";

let app: Application;
let plugin: AbstractPlugin;
beforeEach(() => {
    app = new Application();
    plugin = new Plugin(app);
});

describe("Plugin", () => {
    it("should call the <register> method of a plugin", async () => {
        await plugin.register();

        expect(app.resolve(plugin.getName())).toBeTrue();
    });

    it("should call the <dispose> method of a plugin", async () => {
        await plugin.register();

        expect(app.resolve(plugin.getName())).toBeTrue();

        await plugin.dispose();

        expect(app.resolve(plugin.getName())).toBeFalse();
    });
});
