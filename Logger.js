/*global Util*/     //for Util.Callstack

// logger type enum
var LogType = { INFO: {}, WARNING: {}, ERROR: {}, CALLSTACK: {} };

function Logger() { }

Logger.enableConsole = true;
Logger.callstackOnly = false;

Logger.Log = function (txt, type) {
    if (!type) {
        type = LogType.INFO; // default log type
    }
    switch (type) {
    case LogType.WARNING:
        Logger.Warning(txt);
        break;
    case LogType.ERROR:
        Logger.Error(txt);
        break;
    case LogType.INFO:
        Logger.Info(txt);
        break;
    case LogType.CALLSTACK:
        Logger.Callstack(txt);
        break;
    }
};

Logger.Callstack = function (txt) {
    var csString = '';
    var cs = Util.Callstack();
    for (var i = 0; i < cs.length; i = i + 1) {
        csString += cs[i].toString() + '\n';
    }
    Logger.ToConsole(txt);
    Logger.ToConsole(csString);
};

Logger.Info = function (txt) {
    if (this.callstackOnly) { return; }
    Logger.ToConsole('INF (' + new Date() + '): ' + txt);
};

Logger.Warning = function (txt) {
    if (this.callstackOnly) { return; }
    Logger.ToConsole('WRN (' + new Date() + '): ' + txt);
};

Logger.Error = function (txt) {
    if (this.callstackOnly) { return; }
    Logger.ToConsole('ERR (' + new Date() + '): ' + txt);    
};

Logger.ToConsole = function (txt) {
    if (Logger.enableConsole === false) { return; }
    // direct to browser console for now
    // NOTE: this is where to route to alternative destination
    // for instrumentation or verbose capture
    console.log(txt);
    document.getElementById('console').value = txt + "\n" + document.getElementById('console').value;
};