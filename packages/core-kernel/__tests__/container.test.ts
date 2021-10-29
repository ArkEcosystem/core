import "jest-extended";

import { container } from "@packages/core-kernel/src/container";
import { Container, injectable } from "@packages/core-kernel/src/ioc";

@injectable()
class StubClass {}

beforeEach(() => container.snapshot());
afterEach(() => container.restore());

describe("Container", () => {
    it("should be an inversify container", async () => {
        expect(container).toBeInstanceOf(Container);
    });

    it("should bind a value to the IoC container", () => {
        expect(container.isBound("key")).toBeFalse();

        container.bind("key").toConstantValue("value");

        expect(container.isBound("key")).toBeTrue();
    });

    it("should rebind a value to the IoC container", () => {
        expect(container.isBound("key")).toBeFalse();

        container.bind("key").toConstantValue("value");

        expect(container.get("key")).toBe("value");
        expect(container.isBound("key")).toBeTrue();

        container.rebind("key").toConstantValue("value-new");

        expect(container.get("key")).toBe("value-new");
    });

    it("should unbind a value from the IoC container", () => {
        container.bind("key").toConstantValue("value");

        expect(container.isBound("key")).toBeTrue();

        container.unbind("key");

        expect(container.isBound("key")).toBeFalse();
    });

    it("should get a value from the IoC container", () => {
        container.bind("key").toConstantValue("value");

        expect(container.get("key")).toBe("value");
    });

    it("should resolve a value from the IoC container", () => {
        expect(container.resolve(StubClass)).toBeInstanceOf(StubClass);
    });
});
