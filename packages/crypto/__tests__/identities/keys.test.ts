import "jest-extended";

import { Address } from "../../src/identities/address";
import { Keys } from "../../src/identities/keys";

describe("Identities - Keys", () => {
    describe("fromPassphrase", () => {
        it("should return two keys in hex", () => {
            const keys = Keys.fromPassphrase("secret");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");

            expect(keys.publicKey).toBeString();
            expect(keys.publicKey).toMatch(Buffer.from(keys.publicKey, "hex").toString("hex"));

            expect(keys.privateKey).toBeString();
            expect(keys.privateKey).toMatch(Buffer.from(keys.privateKey, "hex").toString("hex"));
        });

        it("should return address", () => {
            const keys = Keys.fromPassphrase("SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov");
            // @ts-ignore
            const address = Address.fromPublicKey(keys.publicKey.toString("hex"));
            expect(address).toBe("DUMjDrT8mgqGLWZtkCqzvy7yxWr55mBEub");
        });
    });

    describe("fromWIF", () => {
        it("should return two keys in hex", () => {
            const keys = Keys.fromWIF("SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");

            expect(keys.publicKey).toBeString();
            expect(keys.publicKey).toMatch(Buffer.from(keys.publicKey, "hex").toString("hex"));

            expect(keys.privateKey).toBeString();
            expect(keys.privateKey).toMatch(Buffer.from(keys.privateKey, "hex").toString("hex"));
        });

        it("should return address", () => {
            const keys = Keys.fromWIF("SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov");
            // @ts-ignore
            const address = Address.fromPublicKey(keys.publicKey.toString("hex"));
            expect(address).toBe("DCAaPzPAhhsMkHfQs7fZvXFW2EskDi92m8");
        });

        it("should get keys from compressed WIF", () => {
            const keys = Keys.fromWIF("SAaaKsDdWMXP5BoVnSBLwTLn48n96UvG42WSUUooRv1HrEHmaSd4");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");
            expect(keys).toHaveProperty("compressed", true);
        });

        it("should get keys from uncompressed WIF", () => {
            const keys = Keys.fromWIF("6hgnAG19GiMUf75C43XteG2mC8esKTiX9PYbKTh4Gca9MELRWmg");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");
            expect(keys).toHaveProperty("compressed", false);
        });
    });
});
