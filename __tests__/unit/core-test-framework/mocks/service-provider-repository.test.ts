import "jest-extended";

import { ServiceProviderRepository } from "@packages/core-test-framework/src/mocks";
import { ServiceProvider } from "@packages/core-webhooks";
import { Sandbox } from "@packages/core-test-framework/src";

const clear = () => {
    ServiceProviderRepository.setServiceProviders([]);
};

describe("ServiceProviderRepository", () => {
    describe("default values", () => {
        it("allLoadedProviders should return empty array", async () => {
            expect(ServiceProviderRepository.instance.allLoadedProviders()).toEqual([]);
        });
    });

    describe("setRounds", () => {
        let serviceProvider: ServiceProvider;

        beforeEach(() => {
            clear();

            let sandbox = new Sandbox();
            serviceProvider = sandbox.app.resolve(ServiceProvider);

            ServiceProviderRepository.setServiceProviders([serviceProvider]);
        });

        it("allLoadedProviders should return mocked service providers", async () => {
            expect(ServiceProviderRepository.instance.allLoadedProviders()).toEqual([serviceProvider]);
        });
    });
});
