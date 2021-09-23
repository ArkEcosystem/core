# History

## v4.0.0 2019 November 18

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)
-   Minimum required node version changed from `node: >=0.12` to `node: >=8` to keep up with mandatory ecosystem changes

## v3.1.0 2019 November 13

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.0.0 2019 January 1

-   Added JSDoc documentation
-   Asynchronous methods no longer chain
-   Updated [base files](https://github.com/bevry/base) and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.3.0 2018 January 25

-   Updated base files and dependencies

## v2.2.0 2018 January 25

-   Ignore comment lines inside your envfile
    -   Thanks to [andyedwardsdfdl](https://github.com/andyedwardsdfdl) for [pull request #9](https://github.com/bevry/envfile/pull/9)

## v2.1.1 2016 May 27

-   Fixed missing dependency (regression since v1.2.0)

## v2.1.0 2016 May 27

-   Updated internal conventions
    -   Moved from [ESNextGuardian](https://github.com/bevry/esnextguardian) to [Editions](https://github.com/bevry/editions)
        -   No longer exports a ES6 Class, just exports a plain JavaScript object

## v2.0.1 2016 January 14

-   Only include `fs` module for file system operations
-   [This release was live coded. You can watch it here.](https://plus.google.com/events/culb97njofcb2bmui3b7qv2btu4)

## v2.0.0 2016 January 14

-   Converted from CoffeeScript to ESNext
-   Updated internal conventions
-   Updated minimum supported node version from 0.6 to 0.12
-   Removed internally supported yet unused and undocumented `opts` argument
    -   This may be a breaking change if you expected the completion callback to the 3rd argument instead of the 2nd argument
-   [This release was live coded. You can watch it here.](https://plus.google.com/events/culb97njofcb2bmui3b7qv2btu4)

## v1.0.0 2013 May 8

-   Initial working release
