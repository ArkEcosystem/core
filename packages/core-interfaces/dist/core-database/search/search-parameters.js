"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["OP_EQ"] = "equals";
    SearchOperator["OP_IN"] = "in";
    SearchOperator["OP_GTE"] = "gte";
    SearchOperator["OP_LTE"] = "lte";
    SearchOperator["OP_LIKE"] = "like";
    SearchOperator["OP_CONTAINS"] = "contains";
    // placeholder. For parameters that require custom(not a 1-to-1 field to column mapping) filtering logic on the data-layer repo
    SearchOperator["OP_CUSTOM"] = "custom_operator";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));
//# sourceMappingURL=search-parameters.js.map