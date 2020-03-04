import { Application, Container } from "@packages/core-cli/src";
import envPaths from "env-paths";

@Container.injectable()
class StubClass {}

let app;
beforeEach(() => (app = new Application(new Container.Container())));

afterEach(() => jest.resetAllMocks());

describe("ActionFactory", () => {
    it("should bind a value to the IoC container", () => {
        expect(app.isBound("key")).toBeFalse();

        app.bind("key").toConstantValue("value");

        expect(app.isBound("key")).toBeTrue();
    });

    it("should rebind a value to the IoC container", () => {
        expect(app.isBound("key")).toBeFalse();

        app.rebind("key").toConstantValue("value");

        expect(app.get("key")).toBe("value");
        expect(app.isBound("key")).toBeTrue();

        app.rebind("key").toConstantValue("value-new");

        expect(app.get("key")).toBe("value-new");
    });

    it("should unbind a value from the IoC container", () => {
        app.bind("key").toConstantValue("value");

        expect(app.isBound("key")).toBeTrue();

        app.unbind("key");

        expect(app.isBound("key")).toBeFalse();
    });

    it("should get a value from the IoC container", () => {
        app.bind("key").toConstantValue("value");

        expect(app.get("key")).toBe("value");
    });

    it("should resolve a value from the IoC container", () => {
        expect(app.resolve(StubClass)).toBeInstanceOf(StubClass);
    });

    it("should get core paths", () => {
        const paths = envPaths("ark", { suffix: "core" });

        app.bind(Container.Identifiers.ApplicationPaths).toConstantValue(paths);

        expect(app.getCorePath("data")).toEqual(paths.data);
        expect(app.getCorePath("config")).toEqual(paths.config);
        expect(app.getCorePath("cache")).toEqual(paths.cache);
        expect(app.getCorePath("log")).toEqual(paths.log);
        expect(app.getCorePath("temp")).toEqual(paths.temp);
    });

    it("should get console paths with a file", () => {
        const paths = envPaths("ark", { suffix: "core" });

        app.bind(Container.Identifiers.ApplicationPaths).toConstantValue(paths);

        expect(app.getCorePath("data", "file")).toEqual(`${paths.data}/file`);
        expect(app.getCorePath("config", "file")).toEqual(`${paths.config}/file`);
        expect(app.getCorePath("cache", "file")).toEqual(`${paths.cache}/file`);
        expect(app.getCorePath("log", "file")).toEqual(`${paths.log}/file`);
        expect(app.getCorePath("temp", "file")).toEqual(`${paths.temp}/file`);
    });

    it("should get console paths", () => {
        const paths = envPaths("ark", { suffix: "core" });

        app.bind(Container.Identifiers.ConsolePaths).toConstantValue(paths);

        expect(app.getConsolePath("data")).toEqual(paths.data);
        expect(app.getConsolePath("config")).toEqual(paths.config);
        expect(app.getConsolePath("cache")).toEqual(paths.cache);
        expect(app.getConsolePath("log")).toEqual(paths.log);
        expect(app.getConsolePath("temp")).toEqual(paths.temp);
    });

    it("should get console paths with a file", () => {
        const paths = envPaths("ark", { suffix: "core" });

        app.bind(Container.Identifiers.ConsolePaths).toConstantValue(paths);

        expect(app.getConsolePath("data", "file")).toEqual(`${paths.data}/file`);
        expect(app.getConsolePath("config", "file")).toEqual(`${paths.config}/file`);
        expect(app.getConsolePath("cache", "file")).toEqual(`${paths.cache}/file`);
        expect(app.getConsolePath("log", "file")).toEqual(`${paths.log}/file`);
        expect(app.getConsolePath("temp", "file")).toEqual(`${paths.temp}/file`);
    });
});
