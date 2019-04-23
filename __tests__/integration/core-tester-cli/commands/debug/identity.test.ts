import "jest-extended";

import { IdentityCommand } from "../../../../../packages/core-tester-cli/src/commands/debug/identity";

describe("Commands - Identity", () => {
    const fixtureIdentities = require("../../__fixtures__/identities.json");

    it("should return identities from passphrase", async () => {
        const expected = {
            passphrase: "this is a top secret passphrase",
            publicKey: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
            privateKey: "d8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712",
            address: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
        };

        expect(
            await IdentityCommand.run([
                "--data",
                fixtureIdentities.passphrase,
                "--type",
                "passphrase",
                "--network",
                "devnet",
            ]),
        ).toEqual(expected);
    });

    it("should return identities from privateKey", async () => {
        const expected = {
            publicKey: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
            privateKey: "d8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712",
            address: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
        };

        expect(
            await IdentityCommand.run([
                "--data",
                fixtureIdentities.privateKey,
                "--type",
                "privateKey",
                "--network",
                "devnet",
            ]),
        ).toEqual(expected);
    });

    it("should return identities from publicKey", async () => {
        const expected = {
            publicKey: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
            address: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
        };

        expect(
            await IdentityCommand.run([
                "--data",
                fixtureIdentities.publicKey,
                "--type",
                "publicKey",
                "--network",
                "devnet",
            ]),
        ).toEqual(expected);
    });
});
