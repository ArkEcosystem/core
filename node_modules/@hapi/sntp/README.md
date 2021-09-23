<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# sntp

An SNTP v4 client (RFC4330) for node. Simpy connects to the NTP or SNTP server requested and returns the server time
along with the roundtrip duration and clock offset. To adjust the local time to the NTP time, add the returned `t` offset
to the local time.

[![Build Status](https://secure.travis-ci.org/hapijs/sntp.svg?branch=master)](http://travis-ci.org/hapijs/sntp)

# Usage

```javascript
const Sntp = require('@hapi/sntp');

// All options are optional

const options = {
    host: 'nist1-sj.ustiming.org',  // Defaults to pool.ntp.org
    port: 123,                      // Defaults to 123 (NTP)
    resolveReference: true,         // Default to false (not resolving)
    timeout: 1000                   // Defaults to zero (no timeout)
};

// Request server time

const exec = async function () {

    try {
        const time = await Sntp.time(options);
        console.log('Local clock is off by: ' + time.t + ' milliseconds');
        process.exit(0);
    }
    catch (err) {
        console.log('Failed: ' + err.message);
        process.exit(1);
    }
};

exec();
```

If an application needs to maintain continuous time synchronization, the module provides a stateful method for
querying the current offset only when the last one is too old (defaults to daily).

```javascript
// Request offset once

const exec = async function () {

    const offset1 = await Sntp.offset();
    console.log(offset1);                   // New (served fresh)

    // Request offset again

    const offset2 = await Sntp.offset();
    console.log(offset2);                   // Identical (served from cache)
};

exec();
```

To set a background offset refresh, start the interval and use the provided now() method. If for any reason the
client fails to obtain an up-to-date offset, the current system clock is used.

```javascript
const before = Sntp.now();                    // System time without offset

const exec = async function () {

    await Sntp.start();
    const now = Sntp.now();                   // With offset
    Sntp.stop();
};

exec();
```
