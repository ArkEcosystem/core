import * as fixtures from "./fixtures";
import * as generators from "./generators";
import * as helpers from "./helpers";

import * as api from "./matchers/api";
import * as blockchain from "./matchers/blockchain";
import * as fields from "./matchers/fields";
import * as models from "./matchers/models";
import * as transactions from "./matchers/transactions";

// FIX: register whole folder
import matcherBlock from "./matchers/api/block";
import matcherPeer from "./matchers/api/peer";
import matcherResponse from "./matchers/api/response";
import matcherTransaction from "./matchers/api/transaction";

expect.extend(matcherBlock);
expect.extend(matcherPeer);
expect.extend(matcherResponse);
expect.extend(matcherTransaction);

export { fixtures, generators, helpers };

// const modules = [api, blockchain, fields, models, transactions];
// console.log(modules)
// const matchers = {};
// modules.forEach(module => Object.assign(matchers, module));

// const jestExpect = expect;

// if (jestExpect !== undefined) {
//   jestExpect.extend(matchers);
// } else {
//   console.error("Unable to find Jest's global expect."); // tslint:disable-line
// }
