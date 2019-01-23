const { readFileSync } = require("fs");
const { resolve } = require("path");

exports.createBlocks = count => new Array(count).fill(require("./fixtures/block"));

exports.getFixture = value => readFileSync(resolve(__dirname, `./fixtures/${value}`)).toString().trim();

exports.getJSONFixture = value => require(resolve(__dirname, `./fixtures/${value}`));
