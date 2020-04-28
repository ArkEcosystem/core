import { Exceptions } from "@arkecosystem/core-kernel";

export class StreamNotOpen extends Exceptions.Base.Exception {
    constructor(file: string) {
        super(`Stream file file ${file} is not open.`);
    }
}
