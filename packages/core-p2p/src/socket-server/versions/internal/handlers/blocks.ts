import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { validate } from "../../../utils/validate";
import { schema } from "../../peer/schema";

export const storeBlock = req => {
    validate(schema.postBlock, req.data); // this will throw if validation failed

    req.data.block.ip = req.headers.remoteAddress;

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").handleIncomingBlock(req.data.block);
};
