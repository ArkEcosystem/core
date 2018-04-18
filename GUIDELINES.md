# Directory structure for JavaScript/Node Projects

While the following structure is not an absolute requirement or enforced by the tools, it is a recommendation based on what the JavaScript and in particular Node community at large have been following by convention.

Beyond a suggested structure, no tooling recommendations, or sub-module structure is outlined here.

## Directories

* `lib/` is intended for code that can run as-is
* `src/` is intended for code that needs to be manipulated before it can be used
* `build/` is for any scripts or tooling needed to build your project
* `dist/` is for compiled modules that can be used with other systems.
* `bin/` is for any executable scripts, or compiled binaries used with, or built from your module.
* `__test__/` is for all of your project/module's test scripts
 * `unit/` is a sub-directory for unit tests
 * `integration/` is a sub-directory for integration tests
 * `env/` is for any environment that's needed for testing 

## lib & src

The difference in using `lib` vs `src` should be:

* `lib` if you can use node's `require()` directly
* `src` if you can not, or the file must otherwise be manipulated before use

If you are committing copies of module/files that are from other systems, the use of `(lib|src)/vendor/(vendor-name)/(project-name)/` is suggested.

## build

If you have scripts/tools that are needed in order to build your project, they should reside in the `build` directory.  Examples include scripts to fetch externally sourced data as part of your build process.  Another example would be using `build/tasks/` as a directory for separating tasks in a project.

## dist

If your project/module is to be built for use with other platforms (either directly in the browser), or in an `AMD` system (such as `require.js`), then these outputted files should reside under the `dist` directory.

It is recommended to use a `(module)-(version).(platform).[min].js` format for the files that output into this directory.  For example `foo-0.1.0.browser.min.js` or `foo-0.1.0.amd.js`.

## bin

The `bin` folder is for any system modules your package will use and/or generate.

* The compiled `node_gyp` output for your module's binary code.
* Pre-compiled platform binaries
* <code>[package.json/bin](http://browsenpm.org/package.json#bin)</code> scripts for your module
