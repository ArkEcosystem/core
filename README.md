# ARK CORE
This is a rewrite of ark-node to prepare the upcoming AIP11 fork

Still alpha

## Quickstart

### Installation
- Clone repo
- Windows PreRequsities:
  - install https://slproweb.com/download/Win64OpenSSL-1_0_2m.exe 
  - `npm install --global --production windows-build-tools` (pay atention to have correct msbuild tools).
  - if there is still a build error "missing CL.exe" --> create an empty C++ project in Microsoft Visual Studio. If missing it will reinstall correct build tools.

- `npm install -g nodemon`
- `npm install`

#### Database setup
- Check `config/___network___/server.json` (above all database connection parameters)
  - Change database engine if required - set `db.dialect` to one of: `sqlite`, `mysql`, `mssql` or `postgres`
  - Install package (E.g. `npm install ...`: `sqlite3`, `mysql2`, `tedious` or `pg pg-hstore`). Follow instructions from: http://docs.sequelizejs.com/manual/installation/getting-started
    - sqlite also supports in memory. This can be done by setting uri to: `sqlite://:memory:`
  - The `docker-compose up` could be used to create and start the PostgreSQL/MySql database:
  ```sh
  docker-compose up 
  docker-compose -f docker-compose-mysql up
  ```
- Start relay: `npm run start:devnet` to start devnet (use mainnet or testnet as well)
- Start forger: `npm run forge:devnet` (check for passphrases in `config/devnet/delegate.json`)

## TODO: 

  - [x] Rebuild devnet
  - [x] Rebuild mainnet
  - [x] Start independant testnet
  - [x] Fast rebuild (with automatic switch to full rebuild when rebuild is close to network height)
  - [x] Rotating and compressing log
  - [x] Constants in config file, with progressive fork rules (to be improved to take into account rounds instead of height)
  - [x] Support for MySQL (not tested)
  - [x] Support for PostgreSQL
  - [x] Support for SQLite3
  - [x] Support for MsSQL (not tested)
  - [x] Internal API for forger
  - [x] Forger on independent core

Upcoming: 
  - [ ] Testing
  - [ ] P2P API compatibility (60%)
  - [ ] Transaction Pool (20%)
  - [ ] Connect forger to Transaction Pool
  - [ ] New P2P API
  - [ ] Support for MongoDB
  - [ ] Support for LevelDB
  - [ ] Fork management
  - [ ] BIP38 encryption of delegate passphrase
  - [ ] Documentation

## Development

### Testing

To run the tests:
 - `npm test` to test everything.
 - `npm run test:api` to execute the API tests only.
 - `npm run test:unit` to execute the unit tests only.

To watch the source files and run the tests on changes:
 - `npm run test:watch` to test everything.
 - `npm run test:api:watch` to execute the API tests only.
 - `npm run test:unit:watch` to execute the unit tests only.

To calculate coverage:
 - `npm run coverage` would show the report of all tests.
