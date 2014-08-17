The Basics
=============

Simple in-memory sliding window cache with auto-refresh in JavaScript.

Features:
* When adding an item to the cache, provide a callback function that should be used to fetch a fresh version of the data on expiration.
* When getting an item from cache, optionally enable/disable the auto-refresh feature.
* Use the tryget method to skip the expiration and auto-refresh checks and get the item directly from memory.


For details, see the code. It is small and pretty well documented.


Example
========

There is an example in the index.html file.

To run, simply open it in a browser and watch the log update.  In the example, the item will expire every 3 seconds at which time the refresh function will be called and the value will be incremented.
