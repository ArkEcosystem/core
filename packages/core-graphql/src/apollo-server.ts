import { ApolloServer } from "apollo-server-hapi";
import { typeDefs } from "./defs";
import { resolvers } from "./resolvers";

/**
 * Schema used by the Apollo GraphQL plugin for the hapi.js server.
 */
export const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
});
