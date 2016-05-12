Kad Consistency
=============

Extension with simple consistency checks for
[Kad](https://github.com/gordonwritescode/kad).

Usage
-----

Install with NPM.

```bash
npm install kad kad-consistency
```

Integrate with your Kad project.

```js
var kad = require('kad');
var consistency = require('kad-consistency');
var Node = consistency.ConsistentNode(kad.Node);

var seed = {
  address: '127.0.0.1',
  port: 1338
};

var dht = new Node({
  transport: kad.transports.UDP(kad.contacts.AddressPortContact({
    address: '127.0.0.1',
    port: 1337
  })),
  storage: kad.storage.FS('path/to/datadir')
});

dht.connect(seed, function(err) {
  // dht.get(key, callback);
  // dht.put(key, value, callback);
});
```
