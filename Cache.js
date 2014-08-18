/*global Util*/     // for Util.IsNullOrUndefined
/*global Hash*/     // used as base data structure
/*global Logger*/   // used to capture info/errors

function CacheObj(o, k, b, t, r) {
    this.key = k;
    this.val = o;
    this.born = b;
    this.ttl = t;
    this.refresh = r;
}

function Cache() {
    // data cache
    this.dataHash = new Hash();
}

Cache.version = 0.1; // initial version

// adds an item to the cache
// @o - the value of the item to add
// @k - the key for the item
// @t - number of seconds until item expires
// @r - the function to call when the item needs refreshed
Cache.prototype.add = function (o, k, t, r) {
    if (t <= 0 || Util.IsNullOrUndefined(k)) { return false; }
    // add to data hash
    this.dataHash[k] = new CacheObj(o, k, new Date(), t * 1000, r);
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
// returns the object if found else false
Cache.prototype.tryget = function (k) {
    if (Util.IsNullOrUndefined(k)) { return false; }
    var cObj = this.dataHash[k];
    
    return Util.IsNullOrUndefined(cObj) ? false : cObj.val;
};

// gets an item from the cache
// if the item has expired and it has an associated refresh delegate then it will be called
// @k - the key for the item
// @c - the callback function to use for returning values
// @r - flag to indicate if refresh should be called on item expiration
Cache.prototype.get = function (k, c, r) {
    if (Util.IsNullOrUndefined(k) ||
        typeof (c) !== 'function') {
        return false;
    }
    
    // first find item
    var cObj = this.dataHash[k];
    if (Util.IsNullOrUndefined(cObj)) {
        //Logger.Log("Cache MISS! key: " + k);
    
        // TODO: should this send null to the callback function? (and risk double callback potential)
        // OR is it safer to just return false and expect the caller to handle that
        c.call(null, null);
        return false;
    }
    
    // check if item expired
    var curDt = new Date();
    if (curDt.getTime() < (cObj.born.getTime() + cObj.ttl)) {
        // return existing
        c.call(null, cObj.val);
        //Logger.Log("Cache Hit! key: " + k);
        return true;
    } 
    
    if (r === true) {
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
    } else {
        // return existing [auto-refresh wasn't requested]
        c.call(null, cObj.val);
        //Logger.Log("Cache Hit! But expired. No Refresh. Return existing. key: " + k);
    }
    
    return true;
};

// removes an item from cache
Cache.prototype.remove = function (k) {
    if (Util.IsNullOrUndefined(k)) { return false; }
    // set key to null
    this.dataHash[k] = null;
    //Logger.Log("Cache ADD. key: " + k);
    return true;
};
