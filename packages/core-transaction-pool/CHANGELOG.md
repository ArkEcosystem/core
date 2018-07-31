# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased
## 0.0.1 - 2018-07-27
- Splitting guard methods into more smaller units
- Handling duplicates also on incomming payload level (before entering and checking with pool)
- Fix on applychained block - to use correct wallet and update from blockchain wallet only if necesary
- Delete pool wallet if no ballance or no transactions in pool
- Additional tests implemented
- Broadcasting only valid transactions further (verified, and wallet manager applied)

## 0.0.1 - 2018-07-20
- Pool wallet manager implementation to guard the pool
- GetForgingTransactions moved to Transaction Pool
- Blocking of sender if not in conditions or whitelisted
- Guard updated with wallet manager

## 0.0.1 - 2018-05-31
### Added
- initial release
