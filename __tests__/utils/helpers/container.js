"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core_container_1 = require("@arkecosystem/core-container");
require("@arkecosystem/core-jest-matchers");
var awilix_1 = require("awilix");
var lodash_isstring_1 = require("lodash.isstring");
var path = require("path");
// copied from core-container registrars/plugin
var castOptions = function (options) {
    var blacklist = [];
    var regex = new RegExp(/^\d+$/);
    for (var _i = 0, _a = Object.keys(options); _i < _a.length; _i++) {
        var key = _a[_i];
        var value = options[key];
        if (lodash_isstring_1["default"](value) && !blacklist.includes(key) && regex.test(value)) {
            options[key] = +value;
        }
    }
    return options;
};
// copied from core-container registrars/plugin and slightly modified
var applyToDefaults = function (defaults, options) {
    if (defaults) {
        options = Object.assign(defaults, options);
    }
    return castOptions(options);
};
exports.setUpContainer = function (options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                options.network = options.network || "testnet";
                process.env.CORE_PATH_DATA = options.data || process.env.HOME + "/.core";
                process.env.CORE_PATH_CONFIG = options.config
                    ? options.config
                    : path.resolve(__dirname, "../config/" + options.network);
                return [4 /*yield*/, core_container_1.app.setUp("2.1.1", {
                        token: options.token || "ark",
                        network: options.network
                    }, options)];
            case 1:
                _a.sent();
                return [2 /*return*/, core_container_1.app];
        }
    });
}); };
// copied from core-container registrars/plugin and slightly modified
exports.registerWithContainer = function (plugin, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var name, version, defaults, alias, pluginRegistered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!plugin.register) {
                        return [2 /*return*/, undefined];
                    }
                    name = plugin.name || plugin.pkg.name;
                    version = plugin.version || plugin.pkg.version;
                    defaults = plugin.defaults || plugin.pkg.defaults;
                    alias = plugin.alias || plugin.pkg.alias;
                    options = applyToDefaults(defaults, options);
                    return [4 /*yield*/, plugin.register(core_container_1.app, options || {})];
                case 1:
                    pluginRegistered = _a.sent();
                    core_container_1.app.register(alias || name, awilix_1.asValue({
                        name: name,
                        version: version,
                        plugin: pluginRegistered,
                        options: options
                    }));
                    return [2 /*return*/, pluginRegistered];
            }
        });
    });
};
