// Initial config info, will later be read from config or cookies
var host = 'http://pebble.harryonline.net';
var config;
if (typeof require !== 'undefined') {
    var UI = require('ui');
    var Vector2 = require('vector2');
    var Vibe = require('ui/vibe');
    var Settings = require('settings');
}
/**
 * Get the current timestamp
 * @return {int} current time in ms since 01-01-1970
 */
function now() {
    return new Date().getTime();
}
/**
 * Format time
 * @param  {float} ms time in ms
 * @return {string}    formatted time in sec with two decimals, max. 8 char.
 */
function formatTime(ms) {
    var min = Math.floor(ms / 60000);
    var sec = (ms % 60000) / 1000;
    var timeArray = [sec.toFixed(2)];
    if (min > 0) {
        if (sec < 10) {
            timeArray.unshift('0');
        }
        timeArray.unshift(min, ':');
    }
    var timeString = timeArray.join('');
    return timeString.slice(0, 8);
}
/**
 * convert an object to URI string
 * @param  {object} obj javascript objectt
 * @return {string}     URI string with objects variables as parameters
 */
function serialize(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}
/**
 * Fetch laptimes from the server
 * @param  {Function} callback function for processing laptimes
 * @param  {object}   config   configuration info: transponder and track ID's
 */
function myLapsFetcher(callback) {
    this.url = host + '/server2.php';
    this.lastUpdate = now();
    this.fetchId = 0;
    this.callback = callback;
    this.fields = ['numlaps', 'activity'];
    this.params = {};
}
/**
 * Initialize the myLapsFetcher by fetching the laptimes and setting the interval
 */
myLapsFetcher.prototype.init = function() {
    this.fetchId++;
    this.fetch();
    var self = this;
    setInterval(function() {
        self.check();
    }, 10000);
};
/**
 * Merge obj with parameters
 * @param  {object} obj object to be merged
 */
myLapsFetcher.prototype.copyParams = function(obj) {
    for (var field in obj) {
        if (this.fields.indexOf(field) !== -1) {
            this.params[field] = obj[field];
        }
    }
};
/**
 * Check for recent fetches, refetch if not
 */
myLapsFetcher.prototype.check = function() {
    if (now() - this.lastUpdate > 90000) {
        this.reFetch();
    }
};
/**
 * refetch in such a way that previous fetches will not be continued
 */
myLapsFetcher.prototype.reFetch = function() {
    // Only refetch after init()
    if (this.fetchId > 0) {
        this.fetchId++;
        this.fetch();
    }
};
/**
 * Fetch data from server and call callback function
 */
myLapsFetcher.prototype.fetch = function() {
    this.lastUpdate = now();
    var oReq = new XMLHttpRequest();
    var oUrl = this.url + '?' + serialize(config) + '&' + serialize(this.params);
    var currentFetchId = this.fetchId;
    var self = this;
    oReq.onload = function() {
        if (self.fetchId === currentFetchId) {
            var result = JSON.parse(this.responseText);
            var callDelay = 1000; // Wait 1 sec for next call
            console.log(new Date(), JSON.stringify(result));
            if (result.event == 'lap') {
                self.copyParams(result.data);
            } else {
                callDelay = 10000;   // No laps retrieved, wait 10 sec before retrying
            }
            self.callback.call(result);
            setTimeout(function() {
                self.fetch();
            }, callDelay);
        }
    };
    oReq.open("get", oUrl, true);
    oReq.send();
};
/**
 * cPebble to be used when data is simply send to Pebble device with C program
 */
function cPebble() {}
cPebble.prototype.process = function(response) {
    // send response to Pebble with C program
};
/**
 * jsPebble to be used when processing data in JS
 * @param  {obj} device  real or simulated Pebble
 */
function jsPebble(device) {
    this.laptime = 0;
    this.numlaps = 0;
    this.bestlaptime = 0;
    this.lapstogo = 0;
    this.countdownenabled = false;
    this.startlap = 0;
    this.starttime = 0;
    this.device = device;
}
/**
 * Initialization of the device, set actions on button clicks and set up view
 */
jsPebble.prototype.init = function() {
    var self = this;
    this.device.on('click', 'up', function() {
        self.setLaps(1);
    });
    this.device.on('click', 'down', function() {
        self.setLaps(-1);
    });
    this.device.on('click', 'select', function() {
        self.resetLaps();
    });
    this.updateView();
};
/**
 * Set the number of laps for series
 * @param {int} d +1 or -1, increase or descrease number of laps
 */
jsPebble.prototype.setLaps = function(d) {
    if (this.countdownenabled) {
        this.lapstogo += d;
    } else {
        this.lapstogo = 5;
        this.countdownenabled = true;
    }
    if (this.lapstogo < 0) {
        this.lapstogo = 0;
    }
    this.startlap = this.numlaps + this.lapstogo;
    if (this.starttime === 0) {
        this.starttime = -1;
    }
    this.updateView();
};
/**
 * Set lap counter to 0, return to simple lap count, if in series mode
 */
jsPebble.prototype.resetLaps = function() {
    if (this.countdownenabled) {
        this.countdownenabled = false;
    }
    this.startlap = this.numlaps;
    this.starttime = 0;
    this.lapstogo = 0;
    this.updateView();
};
/**
 * Update the information on the Pebble view
 */
jsPebble.prototype.updateView = function() {
    if (this.numlaps === 0) {
        this.device.setText('bestlap', '');
        this.device.setText('laptime', '');
    } else {
        if (this.starttime > 0) {
            this.device.setHeader('bestlap', 'SERIES TIME');
            if (this.lapstogo >= -1) {
                this.device.setText('bestlap', formatTime(this.totaltime - this.starttime));
            }
        } else {
            this.device.setHeader('bestlap', 'BESTLAP');
            this.device.setText('bestlap', formatTime(this.bestlaptime));
        }
        if (this.activity !== undefined && this.laptime !== undefined) {
            this.device.setText('laptime', formatTime(this.laptime));
        } else {
            this.device.setText('laptime', '');
        }
    }
    this.device.setText('numlaps', this.numlaps);
    this.device.setText('count', this.lapstogo);
    this.device.setHeader('count', this.countdownenabled ? 'TO GO' : 'COUNT');
};
/**
 * Process the laptimes information from the server
 * @param  {object} result with event field and, if event=lap, data for these laps
 */
jsPebble.prototype.process = function(result) {
    if (result.event == 'lap') {
        if (this.numlaps !== result.data.numlaps) {
            delete(this.laptime);
            for (var field in result.data) {
                this[field] = result.data[field];
            }
            if (this.countdownenabled) {
                this.lapstogo = this.startlap - this.numlaps;
                switch (this.lapstogo) {
                    case -1: // Finished series
                        this.device.vibrate('double');
                        break;
                    case 0: // Final lap in series
                        this.device.vibrate('long');
                        break;
                    default:
                        this.device.vibrate('short');
                }
            } else {
                this.lapstogo = this.numlaps - this.startlap;
                this.device.vibrate('short');
            }
            // Set starttime of series
            if (this.starttime == -1 && result.data.starttotal !== undefined) {
                this.starttime = result.data.starttotal;
            }
            this.updateView();
        }
    }
};
/**
 * Control the Pebble device using javascript
 */
function pebbleDevice() {
    this.wind = new UI.Window();
    var self = this;
    var elements = ['bestlap', 'laptime', 'numlaps', 'count'];
    var row = 0;
    var left = 0;
    // Set up the screen with four window elements
    elements.forEach(function(name) {
        var top = row * 54;
        var width = row < 2 ? 144 : 72;
        self[name] = [];
        // Insert header
        self[name].header = new UI.Text({
            position: new Vector2(left, top),
            size: new Vector2(width, 20),
            color: row == 1 ? 'black' : 'white',
            backgroundColor: row == 1 ? 'white' : 'black',
            textAlign: 'center',
            font: 'gothic-14',
            text: name.toUpperCase()
        });
        self.wind.add(self[name].header);
        // Insert body
        self[name].body = new UI.Text({
            position: new Vector2(left, top + 14),
            size: new Vector2(width, 36),
            color: row == 1 ? 'black' : 'white',
            backgroundColor: row == 1 ? 'white' : 'black',
            textAlign: 'center',
            font: 'bitham-34-medium-numbers',
            text: ''
        });
        self.wind.add(self[name].body);
        if (row < 2) {
            row++;
        } else {
            left += 72;
        }
    });
    this.wind.fullscreen(true);
    this.wind.show();
}
/**
 * Set handler for events
 * @param  {string} event   e.g. 'click'
 * @param  {string} button  'back', 'up', 'select' or 'down'
 * @param  {function} handler [description]
 */
pebbleDevice.prototype.on = function(event, button, handler) {
    this.wind.on(event, button, handler);
};
/**
 * Set the text in the window element body
 * @param {string} elem name of the element
 * @param {string} text that will be set in body of this element
 */
pebbleDevice.prototype.setText = function(elem, text) {
    this[elem].body.text(text);
};
/**
 * Set the text in the window element header
 * @param {string} elem name of the element
 * @param {string} text that will be set in header of this element
 */
pebbleDevice.prototype.setHeader = function(elem, text) {
    this[elem].header.text(text);
};
/**
 * Vibrate the device
 * @param {string} type of vibration: 'short', 'long' or 'double'
 */
pebbleDevice.prototype.vibrate = function(type) {
    /**
     * repeat a function a number of times with given interval
     * @param {Function} callback function to be repeated
     * @param {int}   interval  time between calls in ms
     * @param {int}   times    number of times to repeat
     */
    function setRepeat(callback, interval, times) {
        callback();
        times--;
        if (times > 0) {
            setTimeout(function() {
                setRepeat(callback, interval, times);
            }, interval);
        }
    }
    if (type === 'double') {
        setRepeat(function() {
            Vibe.vibrate('long');
        }, 1000, 3);
    } else {
        Vibe.vibrate(type);
    }
};

function configUrl(config) {
    var serialConfig = serialize(config);
    var url = host + '/configuration.html' + (serialConfig === '' ? '' : '?' + serialConfig);
    console.log(url);
    return url;
}
// Everything is defined, let's do something
if (typeof require !== 'undefined') {
    console.log('Using Pebble');
    config = Settings.option();
    Settings.config({
        url: configUrl(config)
    }, function(e) {
        console.log('opening configurable');
    }, function(e) {
        console.log('Configured');
        // Show the parsed response
        console.log(JSON.stringify(e.options));
        // Show the raw response if parsing failed
        config = Settings.option();
        if (e.failed) {
            console.log(e.response);
        }
    });
    var pDevice = new pebbleDevice();
    var pebble = new jsPebble(pDevice);
    var fetcher = new myLapsFetcher(function() {
        pebble.process(this);
    }, config);
    pebble.init();
    fetcher.init();
} else {
    console.log('Using Angular');
    var pebble = new jsPebble(ngDevice);
    var fetcher = new myLapsFetcher(function() {
        pebble.process(this);
    }, config);
    $('document').ready(function() {
        pebble.init();
        fetcher.init();
    });
}