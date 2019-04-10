const path = require("path");
const merge = require("webpack-merge");
const nodeExternals = require("webpack-node-externals");
const pkg = require("../package.json");
const base = require("./webpack.base");

const resolve = dir => path.resolve(__dirname, "..", dir);

const format = dist => ({
    path: resolve(path.dirname(dist)),
    filename: path.basename(dist),
});

const browserConfig = {
    target: "web",
    babel: {
        modules: "umd",
        useBuiltIns: "usage",
        targets: {
            browsers: "defaults",
        },
    },
    resolve: {
        alias: {
            deepmerge$: "deepmerge/dist/umd.js",
        },
    },
    node: {
        net: "empty",
    },
    output: {
        ...format(pkg.browser),
        library: "ARKEcosystemCrypto",
        libraryTarget: "umd",
        umdNamedDefine: true,
        globalObject: "this",
    },
};

const moduleConfig = {
    target: "node",
    babel: {
        modules: "commonjs",
        useBuiltIns: "usage",
        targets: {
            node: "current",
        },
    },
    resolve: {
        alias: {
            deepmerge$: "deepmerge/dist/cjs.js",
        },
    },
    externals: [
        nodeExternals({
            modulesFromFile: true,
            modulesDir: resolve("node_modules"),
        }),
    ],
    output: {
        ...format(pkg.module),
        libraryTarget: "commonjs2",
    },
    optimization: {
        minimize: false,
    },
};

module.exports = [browserConfig, moduleConfig].map(({ babel, ...entry }) => merge(base(babel), entry));
