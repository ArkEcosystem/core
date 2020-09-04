import "jest-extended";

import { parseProcessActionResponse } from "@packages/core-manager/src/utils";

import { TriggerResponses } from "../__fixtures__";

describe("ParseProcessActionResponse", () => {
    it("should parse valid response", async () => {
        expect(
            // @ts-ignore
            parseProcessActionResponse({
                stdout: TriggerResponses.forgetCurrentDelegateResponse,
            }),
        ).toEqual({ response: { rank: 16, username: "genesis_25" } });
    });

    it("should parse errored response", async () => {
        expect(
            // @ts-ignore
            parseProcessActionResponse({
                stdout: TriggerResponses.forgetCurrentDelegateError,
            }),
        ).toEqual({ error: "Dummy error" });
    });

    it("should throw error if number of line is not 2", async () => {
        expect(() => {
            // @ts-ignore
            parseProcessActionResponse({
                stdout: "1 processes have received command forger.currentDelegate",
            });
        }).toThrow("Cannot parse process action response");
    });

    it("should throw error if trigger response is invalid", async () => {
        expect(() => {
            // @ts-ignore
            parseProcessActionResponse({
                stdout:
                    '1 processes have received command forger.currentDelegate\n[ark-core:0:default]={"rank":16,"username":"genesis_25"}', // Missing response
            });
        }).toThrow("Invalid process action response");
    });
});
