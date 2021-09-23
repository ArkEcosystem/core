![Snyk logo](https://snyk.io/style/asset/logo/snyk-print.svg)

***

Snyk helps you find, fix and monitor for known vulnerabilities in your dependencies, both on an ad hoc basis and as part of your CI (Build) system.

## Snyk Paket Parser

This parser processes a `paket.lock` and returns a flat list of dependencies.

#### For example:
Input `paket.lock`:
```
  Microsoft.CSharp (4.5) - restriction: || (&& (< net20) (>= netstandard1.0) (< netstandard1.3)) (&& (< net20) (>= netstandard1.3) (< netstandard2.0))
``` 

Output:
```
  [
    { name: 'Microsoft.CSharp', version: '4.5' restriction: '|| (&& (< net20) (>= netstandard1.0) (< netstandard1.3)) (&& (< net20) (>= netstandard1.3) (< netstandard2.0))'}
  ]
```
