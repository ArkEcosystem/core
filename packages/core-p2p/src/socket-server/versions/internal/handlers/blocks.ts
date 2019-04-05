import { app } from "@arkecosystem/core-container";
import { Blockchain, P2P } from "@arkecosystem/core-interfaces";
import { validate } from "../../../utils/validate";
import { schema } from "../../peer/schema";

export const storeBlock = (service: P2P.IPeerService, req) => {
    validate(schema.postBlock, req.data);

    req.data.block.ip = req.headers.remoteAddress;

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").handleIncomingBlock(req.data.block);
};
