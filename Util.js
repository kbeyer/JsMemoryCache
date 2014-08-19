var debug = false;

// Util is a class for scoping common utility functions
function Util() { }

// checks if object is null or undefined
Util.IsNullOrUndefined = function (o) {
    return o === undefined || o === null;
};

// checks if callback is a function
// if so, calls it with specified value
Util.TryInvoke = function (callback, value) {
    if (typeof (callback) === 'function') {
      callback.call(null, value);
    }
};

function StackFrame(funcName, funcSource, flName, lnNumber) {
    this.functionName = funcName;
    this.functionSource = funcSource;
    this.fileName = flName;
    this.lineNumber = lnNumber;
}
StackFrame.prototype.toString = function () {
    return 'at ' + this.functionName + '(' + this.fileName + ':' + this.lineNumber + ')';
};

/**
* Helper function to get javascript callstack
* modified from example at http://blogs.sun.com/scblog/entry/improved_callstack_information_in_javascript
*/
Util.Callstack = function () {
    var stackFrameStrings = new Error().stack.split('\n');
    // remove first two stack frames
    stackFrameStrings.splice(0, 2);
    var stackFrames = [];
    for (var i = 0; i < stackFrameStrings.length; i = i + 1) {
        // a stack frame string split into parts
        var stackFrame = stackFrameStrings[i].split('@');
        if (stackFrame && stackFrame.length === 2) {
            stackFrames.push(
                // Stackframe object
                new StackFrame(stackFrame[0],
                                '',//eval(stackFrame[0].replace(Util.sansParenthesisRE, '')),
                                stackFrame[1].match(Util.fileNameLineNumberRE)[1], // first group
                                stackFrame[1].match(Util.fileNameLineNumberRE)[2]  // second group
                )
            );
        }
    }
    return stackFrames;
};
Util.sansParenthesisRE = /[(][^)]*[)]/;
Util.fileNameLineNumberRE = /(.*):(\d+)$/;
