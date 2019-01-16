import { CoreCodec } from "./core-codec";
import { LiteCodec } from "./lite-codec";

export function getCodec(codec) {
    switch (codec) {
        case "core":
            return new CoreCodec();
        case "lite":
            return new LiteCodec();
        case "msgpack":
            return null;
        default:
            return new LiteCodec();
    }
}
