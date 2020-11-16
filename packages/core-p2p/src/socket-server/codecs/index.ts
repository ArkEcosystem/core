import * as Blocks from "./blocks";
import * as Internal from "./internal";
import * as Peer from "./peer";
import * as Transactions from "./transactions";

export const Codecs = {
    ...Blocks,
    ...Internal,
    ...Peer,
    ...Transactions,
};
