import * as api from "./api";
import * as blockchain from "./blockchain";
import * as fields from "./fields";
import * as models from "./models";
import * as transactions from "./transactions";

const modules = [api, blockchain, fields, models, transactions];
const matchers = {};
modules.forEach(module => Object.assign(matchers, module));

const jestExpect = expect;

if (jestExpect !== undefined) {
  jestExpect.extend(matchers);
} else {
  console.error("Unable to find Jest's global expect."); // tslint:disable-line
}
