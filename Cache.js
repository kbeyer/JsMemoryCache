/*global Util*/     // for Util.IsNullOrUndefined
/*global Hash*/     // used as base data structure
/*global Logger*/   // used to capture info/errors

'use strict';

// CacheObj stores the meta-data used by Cache for understanding
// the current state of a cached object. Only used by Cache.
// @obj         - the object being cached
// @key         - key used to access the object
// @born        - timestamp when object was added to cache
// @ttl         - number of milliseconds before object needs refreshed
// @refreshFn   - function that will be called when object needs updated 
function CacheObj(key, obj, born, ttl, refreshFn) {
    this.key = key;
    this.val = obj;
    this.born = born;
    this.ttl = ttl;
    this.refresh = refreshFn;
}

function Cache() {
    // data cache
    this.dataHash = new Hash();
}

//Cache.version = 0.1; // initial version
Cache.version = 0.2; // merged changes from bruslim/patch-1, reformatting, more docs

// adds an item to the cache
// @k - the key for the item
// @o - the value of the item to add
// @t - number of seconds until item expires
// @r - the function to call when the item needs refreshed
Cache.prototype.add = function (k, o, t, r) {
    if (t <= 0 || Util.IsNullOrUndefined(k)) { return false; }
    // add to data hash
    this.dataHash[k] = new CacheObj(k, o, new Date(), t * 1000, r);
    //Logger.Log("Cache ADD. key: " + k);
    return true;
};

// updates an existing item in the cache
// @k - the key for the item
// @o - the new value for the item
// @t - (optional) update to seconds object should live in cache
Cache.prototype.update = function (k, o, t) {
    if (Util.IsNullOrUndefined(k) ||
        Util.IsNullOrUndefined(this.dataHash[k])) {
        return false;
    }
    // update value
    this.dataHash[k].val = o;
    // update born on date
    this.dataHash[k].born = new Date();
    // check if ttl should be updated
    if (t !== undefined && t > 0) {
        this.dataHash[k].ttl = t * 1000;
    }
    //Logger.Log("Cache UPDATE. key: " + k);
    return true;
   
};

// tries to get an object directly from cache w/o going through expiration and auto-refresh checks
// @k - the key for the item
// @c - the callback function to use for returning values
// returns true if found else false
Cache.prototype.tryGet = function (k, c) {
    if (Util.IsNullOrUndefined(k)) {
        if (typeof (c) === 'function') {
            c.call(null, null)
        }
        return false;
    }
    var cObj = this.dataHash[k];
    var value = Util.IsNullOrUndefined(cObj) ? null : cObj.val;
    if (typeof (c) === 'function') {
        c.call(null, value)
    }
    return value === null;
};

// gets an item from the cache
// if the item has expired and it has an associated refresh delegate then it will be called
// @k - the key for the item
// @c - the callback function to use for returning values
// @r - flag to indicate if refresh should be called on item expiration
Cache.prototype.get = function (k, c, r) {
    if (typeof (c) !== 'function') {
        return false;
    }
    return this.tryGet(k, function(value) {
        var curDt = new Date();
        // if value is null or no auto-refresh or if item expired
        if (!value || 
            !r || 
            curDt.getTime() < (cObj.born.getTime() + cObj.ttl)) {
            // return existing
            c.call(null, value);
            //Logger.Log("Cache Hit! key: " + k);
            return; // exit callback
        } 
        
        if (typeof (cObj.refresh) === 'function') {
            // refresh & let refresh function return value via callback
            cObj.refresh.call(null, cObj.val, c);
            //Logger.Log("Cache Hit! But expired.  Auto-refreshing. key: " + k);
        } else {
            // remove object completely
            this.dataHash[k] = null;
            // return null
            c.call(null, null);
            Logger.Log("Cache Hit! But expired. Can't refresh. Returning NULL. key: " + k);
        }
        
    });
};

// removes an item from cache
Cache.prototype.remove = function (k, c) {
    return this.tryGet(k, function(value){
        if (this.dataHash[k] !== undefined) {
            // remove the key with delete
            delete(this.dataHash[k]);
        }
        // if callback was provided, call it with the value
        if (typeof (c) === 'function') {
            c.call(null, value)
        }
        //Logger.Log("Cache ADD. key: " + k);
    })
};
