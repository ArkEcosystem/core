import { Exception } from "./base";

export class Bip38Exception extends Exception {}

export class MissingConfigFile extends Bip38Exception {
    public constructor(filePath: string) {
        super(`The ${filePath} file does not exist.`);
    }
}

export class PassphraseNotDetected extends Bip38Exception {
    public constructor() {
        super(`We were unable to detect a BIP38 or BIP39 passphrase.`);
    }
}
