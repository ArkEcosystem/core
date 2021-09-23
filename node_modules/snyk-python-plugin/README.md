![Snyk logo](https://snyk.io/style/asset/logo/snyk-print.svg)

***

Snyk helps you find, fix and monitor for known vulnerabilities in your dependencies, both on an ad hoc basis and as part of your CI (Build) system.

## Snyk Python CLI Plugin

This plugin provides dependency metadata for Python projects that use one of the following dependency management methods:

* `pip` with a `requirements.txt` file
* `pipenv` with a `Pipefile` file

There's a special `only-provenance` mode that allows extracting of top-level dependencies with
their corresponding positions in the original manifest file.

## Contributing

[Guide](https://github.com/snyk/snyk-python-plugin/blob/master/.github/CONTRIBUTING.md)

### Developing and Testing

Prerequisites:
- Node.js 6+
- Python 2.7 or 3.6+
- Installed outside of any virtualenv:
    - [pip](https://pip.pypa.io/en/stable/installing/)
    - the contents of `dev-requirements.txt`:
      ```
      pip install --user -r dev-requirements.txt
      ``` 

Tests can be run against multiple python versions by using tox:

```
pip install tox
tox
```

Linting and testing:
```
npm i
npm run lint
npm test
```
