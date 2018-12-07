import { ApolloServer } from "apollo-server-hapi";
import typeDefs from "./defs";
import resolvers from "./resolvers";

/**
 * Schema used by the Apollo GraphQL plugin for the hapi.js server.
 */
export default new ApolloServer({
  typeDefs,
  resolvers,
});
