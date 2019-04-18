import { Utils } from "@arkecosystem/crypto";
import { Blocks, Managers } from "@arkecosystem/crypto";

Managers.configManager.setFromPreset("unitnet");

export const sampleBlock = Blocks.BlockFactory.fromData({
    id: "4398082439836560423",
    version: 0,
    timestamp: 35751416,
    height: 3342573,
    previousBlock: "14909996519459393858",
    numberOfTransactions: 0,
    totalAmount: Utils.BigNumber.make(0),
    totalFee: Utils.BigNumber.make(0),
    reward: Utils.BigNumber.make(200000000),
    payloadLength: 0,
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    generatorPublicKey: "03806036bc1bb470144184b10f815431c580ae2b806d5fd0ba2118dca823c5c4a6",
    blockSignature:
        // tslint:disable-next-line:max-line-length
        "3045022100d0ad616575b1039b89ae22bb8efbce80dd14f52d193ef7a1d0a76fab0253aa4f02206a347bb5d4dc372e5a7ad3f16ae44409d9190fbd8138e9b4e99f83ca3236f91d",
});
