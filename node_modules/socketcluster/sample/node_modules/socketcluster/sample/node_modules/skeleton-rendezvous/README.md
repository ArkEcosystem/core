# skeleton-rendezvous
Node.js module for performing fast rendezvous (HRW) hashing with skeleton - Can efficiently handle a large number of machines/sites.

This approach is slower than consistent hashing but provides much more even distribution of keys across sites - Particularly when there are a large number of sites and keys;
the distribution gets progressively better as you add more keys. It can be configured to prioritize different features (e.g. distribution, performance, remapping %).

Last test results:

![Test results](https://raw.github.com/SocketCluster/skeleton-rendezvous/master/assets/skeleton-rendezvous-tests.png)
