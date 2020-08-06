import commonjs from "@rollup/plugin-commonjs";
import inject from "@rollup/plugin-inject";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import ts from "@wessberg/rollup-plugin-ts";
import builtinModules from "builtin-modules";
import nodePolyfills from "rollup-plugin-node-polyfills";
import { terser } from "rollup-plugin-terser";

import pkg from "./package.json";

const dependencies = Object.keys(pkg.dependencies);
const allModules = [...dependencies, ...builtinModules];

const polyfillsPlugins = [
    inject({
        modules: {
            BigInt: require.resolve("big-integer"),
            process: "process-es6",
            Buffer: ["buffer-es6", "Buffer"],
            global: require.resolve("rollup-plugin-node-polyfills/polyfills/global.js"),
        },
        include: undefined,
    }),
    {
        ...nodePolyfills(),
        transform: null,
    },
];

/** Compatible code for bundlers (webpack, rollup) */
const moduleConfig = {
    input: "src/index.ts",
    output: {
        file: pkg.module,
        format: "esm",
    },
    plugins: [
        json(),
        commonjs({ include: /node_modules/ }),
        ts({
            transpileOnly: true,
            tsconfig: {
                target: "es2015",
                module: "esnext",
                allowSyntheticDefaultImports: true,
                resolveJsonModule: true,
            },
        }),
    ],
    external: allModules,
};

/** Full version with all polyfills and dependencies attached to the file */
const browserConfig = {
    input: "src/index.ts",
    output: [
        {
            file: pkg.unpkg,
            format: "esm",
            plugins: [
                terser(),
            ]
        },
        {
            file: pkg.browser,
            format: "esm",
        },
    ],
    plugins: [
        json(),
        resolve({ preferBuiltins: false, browser: true }),
        commonjs({ include: /node_modules/ }),
        ts({
            transpiler: "babel",
            transpileOnly: true,
            tsconfig: {
                declaration: false,
            },
            babelConfig: {
                presets: [["@babel/preset-env", { loose: false, modules: false, targets: { esmodules: true } }]],
            },
        }),
        ...polyfillsPlugins,
    ],
};

/** Universal code to be used as a standalone package */
const umdConfig = {
    input: "src/index.ts",
    output: {
        file: pkg["umd:main"],
        format: "iife",
        name: "ArkCrypto",
    },
    plugins: [
        json(),
        resolve({ preferBuiltins: false, browser: true }),
        commonjs({ include: /node_modules/ }),
        ts({
            transpiler: "babel",
            transpileOnly: true,
            tsconfig: {
                declaration: false,
            },
            babelConfig: {
                presets: [
                    [
                        "@babel/preset-env",
                        { loose: false, modules: false, targets: { browsers: [">0.25%", "not op_mini all"] } },
                    ],
                ],
            },
        }),
        ...polyfillsPlugins,
    ],
};

export default [moduleConfig, browserConfig, umdConfig];
