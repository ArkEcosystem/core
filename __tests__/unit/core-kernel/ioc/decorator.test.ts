import { Container } from "@packages/core-kernel/src/ioc";
import { decorateInjectable } from "@packages/core-kernel/src/ioc/decorator";

class ThirdPartyClass {}
const container = new Container();

describe("decorateInjectable", () => {
    it("should throw error when resolving class without injectable decoration", () => {
        expect(() => {
            container.resolve(ThirdPartyClass);
        }).toThrowError("Missing required @injectable annotation in: ThirdPartyClass.");
    });

    it("should resolve after decorating class", () => {
        decorateInjectable(ThirdPartyClass);

        expect(container.resolve(ThirdPartyClass)).toBeInstanceOf(ThirdPartyClass);
    });

    it("should allow multiple calls for same class", () => {
        decorateInjectable(ThirdPartyClass);
        decorateInjectable(ThirdPartyClass);

        expect(container.resolve(ThirdPartyClass)).toBeInstanceOf(ThirdPartyClass);
    });
});
