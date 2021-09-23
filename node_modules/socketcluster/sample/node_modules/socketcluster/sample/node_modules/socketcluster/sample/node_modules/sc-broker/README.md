sc-broker
======

*scBroker* is a lightweight key-value store and message broker.
It is written entirely in node.js for maximum portability.

## Installation

```bash
npm install sc-broker
```

## Overview

To use it call:

```js
var scBroker = require('sc-broker');
```

Firstly, launch a new *scBroker* server. If you're using the node cluster module,
you might want to launch the *scBroker* server once from the master process and
then interact with it using *scBroker* clients.

## Server

To launch the **server**, use:

```js
var dataServer = scBroker.createServer({port: 9000, secretKey: 'mySecretKey'})
```

The ```secretKey``` argument is optional; you should use it if you want to
restrict access to the server. If you're running a node cluster, you may want
to use a random key and distribute it to all the workers so that only your
application can interact with the *scBroker* server.

Once the server is setup, you should create clients to interact with it.

**Make sure that the server is running before creating clients**

This ca be done in the following way:

```js
var conf = {port: 9000}
  , server = scBroker.createServer(conf);

server.on('ready', function () {

 console.log('Server ready, create client');
 var client = scBroker.createClient(conf);

 // do client stuff

});
```
After all the server provides a destroy function:

```js
server.destroy()
```

## Client

To create a **client** use:

```js
var dataClient = scBroker.createClient({port: 9000, secretKey: 'mySecretKey'});
```

The ```port``` and ```secretKey``` must match those supplied to the
createServer function.

### Client methods

The client exposes the following methods:
(Please see the [section on keys ](https://github.com/SocketCluster/sc-broker#keys) to
see how you can use keys in *scBroker*. Also, note that the callback argument in
all of the following cases is optional.)


#### exec

```js
exec(code,[data,] callback)
```
Run a special JavaScript function
declaration (code) as a query *on the scBroker server*. This function declaration
accepts the DataMap as a parameter.
This is the most important function in *scBroker*, all the other functions are
basically utility functions to make things quicker. Using exec() offers the
most flexibility. The *callback* is in form:
```
callback(err, data)
```

**Example:**

```js
var queryFn = function (DataMap) {
    // The myMessage variable comes from queryFn.data
    DataMap.set(['main', 'message'], myMessage);
    return DataMap.get(['main']);
};

queryFn.data = {
    myMessage: 'This is an important message'
};

client.exec(queryFn, function (err, data) {
    console.log(data); // outputs {message: "This is an important message"}
});
```
**Note**

The *query functions* are **not** regular functions. Query functions are
executed remotely (on the *scBroker* server), therefore, you cannot access
variables from the outer parent scope while inside them.

To pass data from the current process to use inside your query functions, you
need to set them through the data  property (see ```queryFn.data```) in
example above. Properties of ```queryFn.data``` will be available as regular
variables inside the query function when it gets executed on the server.
All query data is escaped automatically, so it's safe to supply user
input. The ```queryFn.data``` property is optional.


#### set

```js
set(keyChain, value, callback)
```
Set a key-value pair, when the operation has been completed, callback will be
executed. The callback is in form:
```js
callback(err)
```

#### add

```js
add(keyChain, value, callback)
```
Append a value at the given ```keyChain```; the object at ```keyChain``` will
be *treated as an array*. If a value already exists at that ```keyChain``` and
is not an array, this existing value will be placed inside an empty array and
the specified value argument will be appended to that array. The callback is
in form:
```js
callback(err, insertionIndex)
```

#### concat

```js
concat(keyChain, value, callback)
```
Concatenate the array or object at ```keyChain``` with the specified array or
object (```value```). The callback is in form:
```js
callback(err)
```

#### remove

```js
remove(keyChain,[getValue,] callback)
```
Remove the value at ```keyChain```. If value is an array, it will remove the
entire array. The optional ```getValue``` is a *boolean* which indicates
whether or not to *return* the removed value *in the callback*. The callback
is in form:
```js
callback(err, value)
```

#### removeRange

```js
removeRange(keyChain, fromIndex,[ toIndex, getValue,] callback)
```
Remove a range of values at ```keyChain``` between ```fromIndex``` and
```toIndex```. This function assumes that the value at ```keyChain``` is an
object or array. The optional ```getValue``` argument specifies whether or not
to *return* the removed section as an *argument to the callback*. The callback
is in form:
```js
callback(err, value)
```

#### removeAll

```js
removeAll(callback)
```
Clear *scBroker* *completely*. The callback is in form:
```js
callback(err)
```

#### splice

```js
splice(keyChain,[ options,] callback)
```

This operation is designed to work on Arrays (the keyChain argument should point to an Array).
It is similar to JavaScript's Array.splice() function. It can be used to remove and insert elements
within an Array.
The options argument is an object which can have the following properties:
- index // The index at which to start inserting/deleting
- count // The number of items to delete starting from index
- items // An Array of items to insert at index

Callback form:

```js
callback(err, value)
```

#### pop

```js
pop(keyChain,[getValue,] callback)
```

Remove the *last numerically-indexed entry* at ```keyChain```. The optional
``getValue`` is a *boolean* which indicates whether or not to *return* the
removed value in the callback. The callback is in form:
```js
callback(err, value)
```

#### get

```js
get(keyChain, callback)
```
Get the value at ```keyChain```. The callback is in form:
```js
callback(err, value)
```
#### getRange

```js
getRange(keyChain, fromIndex,[ toIndex,] callback)
```
This function assumes that the value at ```keyChain``` is an Array or Object.
Capture all values starting at ```fromIndex``` and finishing at ```toIndex```
but **not including** ```toIndex```. If ```toIndex``` is not specified, all
values from ```fromIndex``` until the end of the Array or Object will be
included. The callback is in form:
```js
callback(err, value)
```

#### getAll

```js
getAll(callback)
```
Get all the values in *scBroker*. The callback is in form:
```js
callback(err, value)
```

#### count

```js
count(keyChain, callback)
```
Count the number of elements at ```keyChain```. The callback is in form:
```js
callback(err, value)
```
## publish subscribe

*scBroker* provides [publish and subscribe](http://redis.io/topics/pubsub)
 functionality.


#### subscribe

```js
subscribe(channel, ackCallback)
```
Watch a ```channel``` on *scBroker*. This is the *scBroker* equivalent to
[Redis' ```subscribe()```](http://redis.io/commands/subscribe). When an event
happens on any watched channel, you can handle it using
```js
scBrokerClient.on('message', function (channel, data) {
    // ...
})
```

#### unsubscribe

```js
unsubscribe(channel, ackCallback)
```
Unwatch the specified ```channel```. If ```channel``` is not specified, it
will unsubscribe from all channels.

#### on

```js
on(event, listener)
```
Listen to events on *scBroker*, you should listen to the 'message' event to handle
messages from subscribed channels. Events are:

* ```'ready'```: Triggers when *scBroker* is initialized and connected. You often
    don't need to wait for that event though. The *scBroker* client will buffer
    actions until the *scBroker* server ready.
* ```'exit'``` This event carries two arguments to it's listener: ```code```
    and ```signal```. It gets triggered when the *scBroker* **server** process
    dies.
* ```'connect_failed'``` This happens if the *scBroker* **client** fails to
    connect to the server after the maximum number of retries have been
    attempted.
* ```'message'``` Captures data published to a channel which the client is
    subscribed to.
* ```'subscribe'``` Triggers whenever a successful subscribe operations occurs.
* ```'subscribefail'``` Triggers whenever a subscribtion fails.
* ```'unsubscribe'``` Triggers on a successful unsubscribe operation.
* ```'unsubscribefail'``` Triggers whenever a unsubscribtion fails.
* ```'error'``` Triggers whenever a error occurs.

#### publish

```js
publish(channel, message, callback)
```
Publish data to a channel - Can be any JSON-compatible JavaScript object.

**Example:**

After starting the server (*server.js*):

```js
var scBroker = require('sc-broker')
  , dss   = scBroker.createServer({port: 9000})
```

a first client (*client1.js*) can subscribe to channel ```foo``` and listen
to ```messages```:

```js
var scBroker = require('sc-broker')
  , dc       = scBroker.createClient({port: 9000})
  , ch       = 'foo'
  , onMsgFn  = function (ch, data) {
      console.log('message on channel ' + ch );
      console.log('data:');
      console.log(data);
    }
dc.subscribe(ch, function (err) {
  if (!err) {
    console.log('client 1 subscribed channel ' + ch  );
  }
})
dc.on('message', onMsgFn )
```

If a second client (*client2.js*) publishes a message, the first client will
execute the ```onMsgFn``` function:

```js
var scBroker  = require('sc-broker')
   , dc    = scBroker.createClient({port: 9000})
   , data  = {a: 'b'}
   , ch    = 'foo';
dc.publish(ch,data , function (err) {
  if (!err) {
    console.log('client 2 published data:');
    console.log(data);
  }
})
```

## Keys

*scBroker* is very flexible with how you can use keys. It lets you set key chains
of any dimension without having to manually create each link in the chain.

A key chain is an array of keys - Each subsequent key in the chain is a child
of the previous key.
For example, consider the following object:
```js
{'this': {'is': {'a': {'key': 123}}}}
```
The key chain ```['this', 'is', 'a', 'key']``` would reference the number
```123```. The key chain ```['this', 'is']``` would reference the object
```{'a': {'key': 123}}```, etc.

When you start, *scBroker* will be empty, but this code is perfectly valid:
```js
dataClient.set(['this', 'is', 'a', 'deep', 'key'], 'Hello world');
```
In this case, *scBroker* will *create* the necessary key chain and set the
bottom-level 'key' to 'Hello World'.
If you were to call:
```js
dataClient.get(['this', 'is', 'a'], function (err, val) {
    console.log(val);
});
```
The above would output:
```js
{deep:{key:'Hello world'}}
```

*scBroker* generally doesn't restrict you from doing anything you want. Following
from the previous example, it is perfectly OK to call this:
```js
dataClient.add(['this', 'is', 'a'], 'foo');
```
In this case, the key chain ```['this', 'is', 'a']``` would evaluate to:
```js
{0:'foo', deep:{key:'Hello world'}}
```
In this case, *scBroker* will add the value at the next numeric index in the
specified key path (which in this case is 0).

You can access numerically-indexed values like this:
```js
dataClient.get(['this', 'is', 'a', 0], function (err, val) {
    console.log(val);
});
```
The output here will be 'foo'.
You can also add entire JSON-compatible objects as value.


## Tests

To run tests, go to the sc-broker module directory then run:

```bash
npm test
```

If you get an error, make sure that you have mocha installed:

```bash
npm install mocha
```
