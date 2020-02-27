export const versionLatest = {
    _id: "@arkecosystem/core",
    _rev: "124-6952dbe729e4e231817e92cb9871148f",
    name: "@arkecosystem/core",
    "dist-tags": {
        latest: "2.5.24",
        next: "2.5.0-next.10",
    },
    versions: {
        "2.5.24": {
            name: "@arkecosystem/core",
            version: "2.5.24",
            description: "Core of the ARK Blockchain",
            license: "MIT",
            contributors: [
                {
                    name: "François-Xavier Thoorens",
                    email: "fx@ark.io",
                },

                {
                    name: "Kristjan Košič",
                    email: "kristjan@ark.io",
                },

                {
                    name: "Brian Faust",
                    email: "brian@ark.io",
                },

                {
                    name: "Alex Barnsley",
                    email: "alex@ark.io",
                },
            ],
            main: "dist/index",
            types: "dist/index",
            bin: {
                ark: "./bin/run",
            },
            scripts: {
                ark: "./bin/run",
                build: "yarn clean && yarn compile && yarn copy",
                "build:watch": "yarn clean && yarn copy && yarn compile -w",
                clean: "del dist",
                compile: "../../node_modules/typescript/bin/tsc",
                copy: "cd ./src && cpy './config' '../dist/' --parents && cd ..",
                "debug:forger": "node --inspect-brk yarn ark forger:run",
                "debug:relay": "node --inspect-brk yarn ark relay:run",
                "debug:start": "node --inspect-brk yarn ark core:run",
                "forger:devnet": "cross-env CORE_PATH_CONFIG=./bin/config/devnet yarn ark forger:run",
                "forger:mainnet": "cross-env CORE_PATH_CONFIG=./bin/config/mainnet yarn ark forger:run",
                "forger:testnet": "cross-env CORE_PATH_CONFIG=./bin/config/testnet yarn ark forger:run --env=test",
                "full:testnet":
                    "cross-env CORE_PATH_CONFIG=./bin/config/testnet yarn ark core:run --networkStart --env=test",
                prepack: "../../node_modules/.bin/oclif-dev manifest && npm shrinkwrap",
                postpack: "rm -f oclif.manifest.json",
                prepublishOnly: "yarn build",
                "relay:devnet": "cross-env CORE_PATH_CONFIG=./bin/config/devnet yarn ark relay:run",
                "relay:mainnet": "cross-env CORE_PATH_CONFIG=./bin/config/mainnet yarn ark relay:run",
                "relay:testnet": "cross-env CORE_PATH_CONFIG=./bin/config/testnet yarn ark relay:run --env=test",
                "start:devnet": "cross-env CORE_PATH_CONFIG=./bin/config/devnet yarn ark core:run",
                "start:mainnet": "cross-env CORE_PATH_CONFIG=./bin/config/mainnet yarn ark core:run",
                "start:testnet": "cross-env CORE_PATH_CONFIG=./bin/config/testnet yarn ark core:run --env=test",
            },
            dependencies: {
                "@arkecosystem/core-api": "^2.5.24",
                "@arkecosystem/core-blockchain": "^2.5.24",
                "@arkecosystem/core-container": "^2.5.24",
                "@arkecosystem/core-database-postgres": "^2.5.24",
                "@arkecosystem/core-event-emitter": "^2.5.24",
                "@arkecosystem/core-exchange-json-rpc": "^2.5.24",
                "@arkecosystem/core-forger": "^2.5.24",
                "@arkecosystem/core-logger-pino": "^2.5.24",
                "@arkecosystem/core-p2p": "^2.5.24",
                "@arkecosystem/core-snapshots": "^2.5.24",
                "@arkecosystem/core-state": "^2.5.24",
                "@arkecosystem/core-transaction-pool": "^2.5.24",
                "@arkecosystem/core-utils": "^2.5.24",
                "@arkecosystem/core-wallet-api": "^2.5.24",
                "@arkecosystem/core-webhooks": "^2.5.24",
                "@arkecosystem/crypto": "^2.5.24",
                "@oclif/command": "^1.5.16",
                "@oclif/config": "^1.13.2",
                "@oclif/plugin-autocomplete": "^0.1.1",
                "@oclif/plugin-commands": "^1.2.2",
                "@oclif/plugin-help": "^2.2.0",
                "@oclif/plugin-not-found": "^1.2.2",
                "@oclif/plugin-plugins": "^1.7.8",
                "@typeskrift/foreman": "^0.2.1",
                bip39: "^3.0.2",
                bytebuffer: "^5.0.1",
                chalk: "^2.4.2",
                clear: "^0.1.0",
                "cli-progress": "^2.1.1",
                "cli-table3": "^0.5.1",
                "cli-ux": "^5.3.1",
                dayjs: "^1.8.15",
                "env-paths": "^2.2.0",
                envfile: "^3.0.0",
                execa: "^2.0.3",
                "fast-levenshtein": "^2.0.6",
                "fs-extra": "^8.1.0",
                "latest-version": "^5.1.0",
                listr: "^0.14.3",
                "lodash.minby": "^4.6.0",
                "nodejs-tail": "^1.1.0",
                "pretty-bytes": "^5.2.0",
                "pretty-ms": "^5.0.0",
                prompts: "^2.1.0",
                "read-last-lines": "^1.7.1",
                semver: "^6.2.0",
                wif: "^2.0.6",
            },
            devDependencies: {
                "@types/bip39": "^2.4.2",
                "@types/bytebuffer": "^5.0.40",
                "@types/cli-progress": "^1.8.1",
                "@types/fast-levenshtein": "^0.0.1",
                "@types/fs-extra": "^8.0.0",
                "@types/got": "^9.6.1",
                "@types/listr": "^0.14.0",
                "@types/lodash.minby": "^4.6.6",
                "@types/pretty-ms": "^4.0.0",
                "@types/prompts": "^2.4.0",
                "@types/semver": "^6.0.1",
                "@types/wif": "^2.0.1",
            },
            engines: {
                node: ">=10.x",
            },
            publishConfig: {
                access: "public",
            },
            oclif: {
                commands: "./dist/commands",
                hooks: {
                    init: ["./dist/hooks/init/config", "./dist/hooks/init/update"],
                    command_not_found: ["./dist/hooks/command_not_found/suggest"],
                },
                bin: "ark",
                topics: {
                    config: {
                        description: "manage core config variables",
                    },
                    env: {
                        description: "manage core environment variables",
                    },
                    core: {
                        description: "manage a core instance (relay & forger)",
                    },
                    forger: {
                        description: "manage a forger instance",
                    },
                    relay: {
                        description: "manage a relay instance",
                    },
                    snapshot: {
                        description: "manage a relay snapshots",
                    },
                    chain: {
                        description: "commands to interact with the blockchain",
                    },
                    network: {
                        description: "manage network configurations and tasks",
                    },
                },
                plugins: ["@oclif/plugin-autocomplete", "@oclif/plugin-commands", "@oclif/plugin-help"],
            },
            _id: "@arkecosystem/core@2.5.24",
            _nodeVersion: "10.16.0",
            _npmVersion: "6.9.0",
            dist: {
                integrity:
                    "sha512-l6SfF1F7dGHda0yvSFx9prao7FLSR9HhWOyQvp9NVGAxERvw5ne21xkWwb5HEZyh5UGpt68JbmLvIuNPlvCAMg==",
                shasum: "531cdc7e9d5be02a14b8572d427e6c7c0bf80de2",
                tarball: "https://registry.npmjs.org/@arkecosystem/core/-/core-2.5.24.tgz",
                fileCount: 192,
                unpackedSize: 997808,
                "npm-signature":
                    "-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v3.0.4\r\nComment: https://openpgpjs.org\r\n\r\nwsFcBAEBCAAQBQJdbymACRA9TVsSAnZWagAAvbwP/3+wSJgA1ya33pVBisdw\n3+tDZbz8xdBigUd8TGtHkt4rkv+nQNsUyfZMhNBhCq/hiSMskJH6FAn9ULOH\nw9730vS8T1OILqzJR9f3dau+UPc2JFgmyt/4fV7R0Xt/HyiTZfeNJyQN9C+g\nJu2Mm9P5lZYl2+/QvS2QW7ZiRy0S3gIG8p4HbJWyM/s/XHSxmQLCvHTthoQT\n62oyBctIzYRFXqblc1+L1B/JaQ1wkjDDoztfUqnupOcj/vrZcq8e2TB8L7Si\nUlPuRjjXDlqeJrKMkwL54rOzN/kOSiI27ULYbnBVWm+7RHrQ07bP9EyfvaHb\nEQzmfPJaI0d1Q71NVRhFircT2zdgzGs26PMj3lEh+9J8P0oCUEKqk2MZtQ3b\nsVr6xkG1EO5ShtJPeOtUuqvp72ZbcpA50EmhCYsdW9yAe2NyI6Ggz9GTMi1c\n+QCOeidbNoxfBWe6CYw0bgqlbGGm+0e3BnMe2/4gcgnxohYc9SqjOABo+j50\nFt4Xi9UJsNenI1fYZTMU0mCVhtg1mHVgDSatHARQc9v2zZhCZ5oEsc/oWcZA\nTmrQYKNukITZjTAHW5CyT4LlixtrlUjY8DHiWcIbOJOCX/Chx4IDaYmLwCRk\nEdSnFEb0BJnd9dpZ9sXA0OgShN45IKFg178BQWyouWmS8OKugDdfpwi+Hprt\njymO\r\n=wd14\r\n-----END PGP SIGNATURE-----\r\n",
            },
        },
    },
};

export const versionNext = {
    _id: "@arkecosystem/core",
    _rev: "124-6952dbe729e4e231817e92cb9871148f",
    name: "@arkecosystem/core",
    "dist-tags": {
        latest: "2.5.24",
        next: "2.5.0-next.10",
    },
    versions: {
        "2.5.0-next.10": {
            name: "@arkecosystem/core",
            version: "2.5.0-next.10",
            description: "Core of the ARK Blockchain",
            license: "MIT",
            contributors: [
                {
                    name: "François-Xavier Thoorens",
                    email: "fx@ark.io",
                },

                {
                    name: "Kristjan Košič",
                    email: "kristjan@ark.io",
                },

                {
                    name: "Brian Faust",
                    email: "brian@ark.io",
                },

                {
                    name: "Alex Barnsley",
                    email: "alex@ark.io",
                },
            ],
            main: "dist/index",
            types: "dist/index",
            bin: {
                ark: "./bin/run",
            },
            scripts: {
                ark: "./bin/run",
                build: "yarn clean && yarn compile && yarn copy",
                "build:watch": "yarn clean && yarn copy && yarn compile -w",
                clean: "del dist",
                compile: "../../node_modules/typescript/bin/tsc",
                copy: "cd ./src && cpy './config' '../dist/' --parents && cd ..",
                "debug:forger": "node --inspect-brk yarn ark forger:run",
                "debug:relay": "node --inspect-brk yarn ark relay:run",
                "debug:start": "node --inspect-brk yarn ark core:run",
                "forger:devnet": "cross-env CORE_PATH_CONFIG=./bin/config/devnet yarn ark forger:run",
                "forger:mainnet": "cross-env CORE_PATH_CONFIG=./bin/config/mainnet yarn ark forger:run",
                "forger:testnet": "cross-env CORE_PATH_CONFIG=./bin/config/testnet yarn ark forger:run --env=test",
                "full:testnet":
                    "cross-env CORE_PATH_CONFIG=./bin/config/testnet yarn ark core:run --networkStart --env=test",
                prepack: "../../node_modules/.bin/oclif-dev manifest && npm shrinkwrap",
                postpack: "rm -f oclif.manifest.json",
                prepublishOnly: "yarn build",
                "relay:devnet": "cross-env CORE_PATH_CONFIG=./bin/config/devnet yarn ark relay:run",
                "relay:mainnet": "cross-env CORE_PATH_CONFIG=./bin/config/mainnet yarn ark relay:run",
                "relay:testnet": "cross-env CORE_PATH_CONFIG=./bin/config/testnet yarn ark relay:run --env=test",
                "start:devnet": "cross-env CORE_PATH_CONFIG=./bin/config/devnet yarn ark core:run",
                "start:mainnet": "cross-env CORE_PATH_CONFIG=./bin/config/mainnet yarn ark core:run",
                "start:testnet": "cross-env CORE_PATH_CONFIG=./bin/config/testnet yarn ark core:run --env=test",
            },
            dependencies: {
                "@arkecosystem/core-api": "^2.5.0-next.10",
                "@arkecosystem/core-blockchain": "^2.5.0-next.10",
                "@arkecosystem/core-container": "^2.5.0-next.10",
                "@arkecosystem/core-database-postgres": "^2.5.0-next.10",
                "@arkecosystem/core-event-emitter": "^2.5.0-next.10",
                "@arkecosystem/core-exchange-json-rpc": "^2.5.0-next.10",
                "@arkecosystem/core-forger": "^2.5.0-next.10",
                "@arkecosystem/core-logger-pino": "^2.5.0-next.10",
                "@arkecosystem/core-p2p": "^2.5.0-next.10",
                "@arkecosystem/core-snapshots": "^2.5.0-next.10",
                "@arkecosystem/core-state": "^2.5.0-next.10",
                "@arkecosystem/core-transaction-pool": "^2.5.0-next.10",
                "@arkecosystem/core-utils": "^2.5.0-next.10",
                "@arkecosystem/core-wallet-api": "^2.5.0-next.10",
                "@arkecosystem/core-webhooks": "^2.5.0-next.10",
                "@arkecosystem/crypto": "^2.5.0-next.10",
                "@oclif/command": "^1.5.16",
                "@oclif/config": "^1.13.2",
                "@oclif/plugin-autocomplete": "^0.1.1",
                "@oclif/plugin-commands": "^1.2.2",
                "@oclif/plugin-help": "^2.2.0",
                "@oclif/plugin-not-found": "^1.2.2",
                "@oclif/plugin-plugins": "^1.7.8",
                "@typeskrift/foreman": "^0.2.1",
                bip39: "^3.0.2",
                bytebuffer: "^5.0.1",
                chalk: "^2.4.2",
                clear: "^0.1.0",
                "cli-progress": "^2.1.1",
                "cli-table3": "^0.5.1",
                "cli-ux": "^5.3.1",
                dayjs: "^1.8.15",
                "env-paths": "^2.2.0",
                envfile: "^3.0.0",
                execa: "^2.0.3",
                "fast-levenshtein": "^2.0.6",
                "fs-extra": "^8.1.0",
                "latest-version": "^5.1.0",
                listr: "^0.14.3",
                "lodash.minby": "^4.6.0",
                "nodejs-tail": "^1.1.0",
                "pretty-bytes": "^5.2.0",
                "pretty-ms": "^5.0.0",
                prompts: "^2.1.0",
                "read-last-lines": "^1.7.1",
                semver: "^6.2.0",
                wif: "^2.0.6",
            },
            devDependencies: {
                "@types/bip39": "^2.4.2",
                "@types/bytebuffer": "^5.0.40",
                "@types/cli-progress": "^1.8.1",
                "@types/fast-levenshtein": "^0.0.1",
                "@types/fs-extra": "^8.0.0",
                "@types/got": "^9.6.1",
                "@types/listr": "^0.14.0",
                "@types/lodash.minby": "^4.6.6",
                "@types/pretty-ms": "^4.0.0",
                "@types/prompts": "^2.4.0",
                "@types/semver": "^6.0.1",
                "@types/wif": "^2.0.1",
            },
            engines: {
                node: ">=10.x",
            },
            publishConfig: {
                access: "public",
            },
            oclif: {
                commands: "./dist/commands",
                hooks: {
                    init: ["./dist/hooks/init/config", "./dist/hooks/init/update"],
                    command_not_found: ["./dist/hooks/command_not_found/suggest"],
                },
                bin: "ark",
                topics: {
                    config: {
                        description: "manage core config variables",
                    },
                    env: {
                        description: "manage core environment variables",
                    },
                    core: {
                        description: "manage a core instance (relay & forger)",
                    },
                    forger: {
                        description: "manage a forger instance",
                    },
                    relay: {
                        description: "manage a relay instance",
                    },
                    snapshot: {
                        description: "manage a relay snapshots",
                    },
                    chain: {
                        description: "commands to interact with the blockchain",
                    },
                    network: {
                        description: "manage network configurations and tasks",
                    },
                },
                plugins: ["@oclif/plugin-autocomplete", "@oclif/plugin-commands", "@oclif/plugin-help"],
            },
            readme:
                '# ARK Core - Core\n\n<p align="center">\n    <img src="https://raw.githubusercontent.com/ARKEcosystem/core/master/banner.png" />\n</p>\n\n## Documentation\n\nYou can find installation instructions and detailed instructions on how to use this package at the [dedicated documentation site](https://docs.ark.io/guidebook/core/plugins/required/core.html).\n\n## Security\n\nIf you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.\n\n## Credits\n\nThis project exists thanks to all the people who [contribute](../../../../contributors).\n\n## License\n\n[MIT](LICENSE) © [ARK Ecosystem](https://ark.io)\n',
            readmeFilename: "README.md",
            _id: "@arkecosystem/core@2.5.0-next.10",
            _nodeVersion: "10.16.0",
            _npmVersion: "6.9.0",
            dist: {
                integrity:
                    "sha512-J7hNdeVVDj6QKlFwAtyVathZCGGvwGREDBfVr7zS9h7NG1RJUMRv+VDOQpRKAil6X7DHBFN3KgNqovAuUzoudQ==",
                shasum: "fb977ee50721ee854e672f7de1410e479e5fcbc9",
                tarball: "https://registry.npmjs.org/@arkecosystem/core/-/core-2.5.0-next.10.tgz",
                fileCount: 192,
                unpackedSize: 945581,
                "npm-signature":
                    "-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v3.0.4\r\nComment: https://openpgpjs.org\r\n\r\nwsFcBAEBCAAQBQJdQBH0CRA9TVsSAnZWagAAgawP/1fcDjs9OYf6eBYIOHxi\nq8yh5fRdqxBDOC1h30ZSI+b6ovJ3FNLev3IWZWoK74IZZtZv0uIYpjSphWGM\nNRHXokau3jiATmQ1myKAm2yzkwmPdL31vqvVGHm9d0nK2HBUsDOzlL3ZomKs\ndmboDImAJ6WYMkp79R/J2hPryIjFhMDZMrxse8q1Hcfs4usacdZFA3oxhNFV\nz+kr5TIRdW1JsiiKTXSwq5P8f+NXoyLgnwEkLfC4yPIY6uWtDwko+NEHLDb/\n88r0tRr1wzSHJbyZtDm/i+0++ZAwrAfLIPlZu6VjPLH7xqEDfGoQC/dEdYG1\n2uOWcFgD3U/WyAXEbbarCgBdUJ3+xXbA01Nx76+QonT7S5rL1bt1y5Fwubmy\nf58aJnjrtQxk+vhUSHEltoT154m1olEidHjjDbanMwsVOWFOqa/u2fEHIUVC\nDl0yYnEJXuUUF0pPkqPwz5wrdNEqp6/kHOe8xaoAzQJF3PXBnmUZO4ZgvccB\nGVPlpu/lsPpeHK2WiE6rsO83ntpynmppnmKC1gw/0VRYkVweWClAKKEALcYa\nBuFjA/+QKpHB7Wem/YdZv0TwC0lVMV+TRU+HUZzcIX+juy7GdbcDULAowYti\nYMjXGnxPmvZePSrFD2/QVNZ6uYBJ+kmoMTAYNNvCCcFuDA5HlsVBc3OMTysG\nK/KF\r\n=pjde\r\n-----END PGP SIGNATURE-----\r\n",
            },
            maintainers: [
                {
                    email: "alex@barnsleyservices.com",
                    name: "alexbarnsley",
                },

                {
                    email: "fx.thoorens@ark.io",
                    name: "arkio",
                },

                {
                    email: "hello@basecode.sh",
                    name: "faustbrian",
                },

                {
                    email: "dev@jaml.pro",
                    name: "j-a-m-l",
                },

                {
                    email: "kristjan@ark.io",
                    name: "kristjankosic",
                },

                {
                    email: "luciorubeens@gmail.com",
                    name: "luciorubeens",
                },

                {
                    email: "joshua@ark.io",
                    name: "supaiku",
                },
            ],
            _npmUser: {
                name: "faustbrian",
                email: "hello@basecode.sh",
            },
            directories: {},
            _npmOperationalInternal: {
                host: "s3://npm-registry-packages",
                tmp: "tmp/core_2.5.0-next.10_1564479986828_0.13168983569100656",
            },
            _hasShrinkwrap: false,
        },
    },
};
