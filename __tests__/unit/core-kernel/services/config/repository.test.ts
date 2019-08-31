import "jest-extended";
import { ConfigRepository } from "@packages/core-kernel/src/services/config/repository";

let configRepository: ConfigRepository;
beforeEach(() => (configRepository = new ConfigRepository({})));

describe("ConfigRepository", () => {
    it("should set, get and unset the given key-value", () => {
        expect(configRepository.has("key")).toBeFalse();

        configRepository.set("key", "value");

        expect(configRepository.all()).toEqual({ key: "value" });
        expect(configRepository.get("key")).toBe("value");
        expect(configRepository.has("key")).toBeTrue();

        configRepository.unset("key");

        expect(configRepository.get("key", "defaultValue")).toBe("defaultValue");
        expect(configRepository.has("key")).toBeFalse();
    });
});
