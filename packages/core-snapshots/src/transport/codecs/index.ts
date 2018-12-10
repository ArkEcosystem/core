import { ArkCodec } from "./ark-codec";
import { LiteCodec } from "./lite-codec";

export function getCodec(codec) {
    switch (codec) {
        case "ark":
            return new ArkCodec();
        case "lite":
            return new LiteCodec();
        case "msgpack":
            return null;
        default:
            return new LiteCodec();
    }
}
