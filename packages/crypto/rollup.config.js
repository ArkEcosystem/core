import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";

export default {
    input: "dist/index.js", // our source file
    output: [
        {
            file: pkg.main,
            format: "cjs"
        },
        {
            file: pkg.module,
            format: "es" // the preferred format
        },
        {
            file: pkg.browser,
            format: "iife",
            name: "arkcrypto" // the global which can be used in a browser
        }
    ],
    external: [
        ...Object.keys(pkg.dependencies || {})
    ],
    plugins: [
        json({
            // for tree-shaking, properties will be declared as
            // variables, using either `var` or `const`
            preferConst: true, // Default: false
    
            // ignores indent and generates the smallest code
            compact: true, // Default: false
        }),
        nodeResolve({
            jsnext: true,
            main: true
        }),
        commonjs({
            namedExports: {
                "dist/index.js": ["__moduleExports"]
            }
        }),
        terser() // minifies generated bundles
    ]
};