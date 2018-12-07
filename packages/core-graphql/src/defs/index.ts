import inputs from "./inputs";
import root from "./root";
import types from "./types";

/**
 * Concatenated strings following the GraphQL syntax to define Types
 * processed by the schema.
 */
export default `
  ${inputs}
  ${root}
  ${types}
`;
