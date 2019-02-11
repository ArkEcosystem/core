import GraphQLTypes from "graphql-tools-types";
import * as queries from "./queries";
import { Block } from "./relationship/block";
import { Transaction } from "./relationship/transaction";
import { Wallet } from "./relationship/wallet";

/**
 * Resolvers used by the executed schema when encountering a
 * scalar or type.
 *
 * All of our scalars are based on graphql-tools-types which helps us with
 * query standardization.
 *
 * We introduce relationships and queries for our own types,
 * these hold the data processing responsibilities of the complete
 * GraphQL query flow.
 */

export const resolvers = {
    JSON: GraphQLTypes.JSON({ name: "Json" }),
    Limit: GraphQLTypes.Int({ name: "Limit", min: 1, max: 100 }),
    Offset: GraphQLTypes.Int({ name: "Offset", min: 0 }),
    Address: GraphQLTypes.String({
        name: "Address",
        regex: /^[AaDd]{1}[0-9a-zA-Z]{33}/,
    }),
    Query: queries,
    Block,
    Transaction,
    Wallet,
};
