import "jest-extended";

import { resolve } from "path";
import { Container } from "../../../../packages/core-container/src/container";
import { PluginRegistrar } from "../../../../packages/core-container/src/registrars/plugin";

const stubPluginPath = resolve(__dirname, "../__stubs__");

const resolveStubPath = value => resolve(stubPluginPath, value);

let instance;
beforeEach(() => {
    process.env.CORE_PATH_CONFIG = stubPluginPath;

    const container = new Container();
    container.config = {
        get: () => {
            return require("../__stubs__/plugins.js");
        },
    };

    instance = new PluginRegistrar(container);
});

describe("Plugin Registrar", () => {
    it("should load the plugins and their options", () => {
        for (const char of ["a", "b", "c"]) {
            const pluginName = resolveStubPath(`./plugin-${char}`);
            expect(instance.plugins[pluginName]).toBeObject();
        }

        expect(instance.plugins[resolveStubPath("./plugin-b")]).toHaveProperty("property", "value");
    });

    describe("register", () => {
        it("should register plugins from paths", async () => {
            const pluginName = resolveStubPath("./plugin-a");

            await instance.register(pluginName, { enabled: false });

            expect(instance.container.has("stub-plugin-a")).toBeTrue();
        });
    });

    describe("setUp", () => {
        it("should register each plugin", async () => {
            await instance.setUp();
            const plugins = ["a", "b", "c"];
            for (const char of plugins) {
                expect(instance.container.has(`stub-plugin-${char}`)).toBeTrue();
            }
        });

        describe("with a plugin name as the value of the `exit` option", () => {
            it("should register the plugins but ignore the rest", async () => {
                instance.options.exit = resolveStubPath("./plugin-a");

                await instance.setUp();
                expect(instance.container.has("stub-plugin-a")).toBeTrue();
                const plugins = ["b", "c"];
                for (const char of plugins) {
                    expect(instance.container.has(`stub-plugin-${char}`)).toBeFalse();
                }
            });
        });
    });

    describe("tearDown", () => {
        const plugins: any = {};

        beforeEach(async () => {
            await instance.setUp();
            const dummyPlugins = ["a", "b", "c"];
            for (const char of dummyPlugins) {
                expect(instance.container.has(`stub-plugin-${char}`)).toBeTrue();
            }
            for (const char of dummyPlugins) {
                plugins[char] = require(`${stubPluginPath}/plugin-${char}`);
            }
        });

        it("should deregister plugins supporting deregister", async () => {
            const dummyPlugins = ["a", "b"];
            for (const char of dummyPlugins) {
                plugins[char].plugin.deregister = jest.fn();
            }

            await instance.tearDown();
            for (const char of dummyPlugins) {
                expect(plugins[char].plugin.deregister).toHaveBeenCalled();
            }

            expect(plugins.c.deregister).not.toBeDefined();
        });

        it("should deregister all the plugins in inverse order", async () => {
            const spy = jest.fn();
            const dummyPlugins = ["a", "b"];
            for (const char of dummyPlugins) {
                plugins[char].plugin.deregister = () => spy(char);
            }

            await instance.tearDown();

            expect(spy).toHaveBeenNthCalledWith(1, "b");
            expect(spy).toHaveBeenNthCalledWith(2, "a");
        });
    });

    describe.skip("__castOptions", () => {
        it("should cast options", async () => {
            const options = {
                number: "1",
                notANumber: "0.0.0.0",
            };

            instance.__castOptions(options);
            expect(options.number).toEqual(1);
            expect(options.notANumber).toEqual("0.0.0.0");
        });
    });
});
