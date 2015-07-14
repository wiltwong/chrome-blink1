var blink1 = undefined;

var ui = {
    picker: null,
    r: null,
    g: null,
    b: null
};

var bg = this;

function onAppWindowClosed() {
    ui.r.value = 0;
    ui.g.value = 0;
    ui.b.value = 0;
    setGradients();
    enableControls(false);
    if (blink1) {
        blink1.fadeRgb(0, 0, 0, 250, 0);
        blink1.disconnect(function() {});
    }
    window.close();
}

chrome.runtime.onConnectExternal.addListener(function(port) {
    //console.log('Initilaizing Blink(1) App');
    if (!document.getElementById('picker')) {
        // Create the structure for the UI elements in background document
        // (cheating here, too lazy to mimick all the original UI elements in prototypes)
        var pickerObj = document.createElement("SELECT");
        pickerObj.id = 'picker';
        var optionObj = document.createElement("OPTION");
        optionObj.id = 'empty';
        optionObj.text = 'No devices found.';
        optionObj.selected = true;
        pickerObj.appendChild(optionObj);
        document.body.appendChild(pickerObj);
        
        var rObj = document.createElement("INPUT");
        rObj.id = 'r';
        rObj.setAttribute("type", "range");
        rObj.setAttribute("min", 0);
        rObj.setAttribute("max", 255);
        rObj.setAttribute("value", 0);
        rObj.setAttribute("disabled", true);
        document.body.appendChild(rObj);
        
        var gObj = document.createElement("INPUT");
        gObj.id = 'g';
        gObj.setAttribute("type", "range");
        gObj.setAttribute("min", 0);
        gObj.setAttribute("max", 255);
        gObj.setAttribute("value", 0);
        gObj.setAttribute("disabled", true);
        document.body.appendChild(gObj);
        
        var bObj = document.createElement("INPUT");
        bObj.id = 'b';
        bObj.setAttribute("type", "range");
        bObj.setAttribute("min", 0);
        bObj.setAttribute("max", 255);
        bObj.setAttribute("value", 0);
        bObj.setAttribute("disabled", true);
        document.body.appendChild(bObj);
    }
    
    for (var k in ui) {
      var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
      var element = document.getElementById(id);
      if (!element) {
        throw "Missing UI element: " + k;
      }
      ui[k] = element;
    }
    setGradients();
    
    chrome.hid.getDevices({}, onDevicesEnumerated);
    if (chrome.hid.onDeviceAdded) {
        chrome.hid.onDeviceAdded.addListener(onDeviceAdded);
    }
    if (chrome.hid.onDeviceRemoved) {
        chrome.hid.onDeviceRemoved.addListener(onDeviceRemoved);
    }
    
    // add listener for messages
    port.onMessage.addListener(function(msg) {
        //console.log(msg);
        if (msg.event == "hangout-shutdown"){
            //console.log("hangout-shutdown");
            onAppWindowClosed();
        } else if (msg.event == "hangout-startup") {
            var monitor = function() {
                if (blink1) {
                    ui.r.value = 255;
                    ui.g.value = 0;
                    ui.b.value = 0;
                    setGradients();
                    enableControls(true);
                    blink1.fadeRgb(255, 0, 0, 250, 0);
                    return;
                } else {
                    setTimeout(monitor, 250);
                }
            };
            monitor();
        } else if (msg.event == "status") {
        
            // Could pass object but why tempt fate?
            var pickerOptions = [];
            for (var k=0; k<ui.picker.length; k++) {
                pickerOptions[k] = new Object();
                pickerOptions[k].id = ui.picker[k].id;
                pickerOptions[k].text = ui.picker[k].text;
            }
            var pickerOptionsStr = JSON.stringify(pickerOptions);
        
            port.postMessage({
                // for some reason, I can't pass the UI object back properly
                event: "status",
                r_value: ui.r.value, 
                r_disabled: ui.r.disabled,
                r_background: ui.r.style.background,
                g_value: ui.g.value,
                g_disabled: ui.g.disabled,
                g_background: ui.g.style.background,
                b_value: ui.b.value,
                b_disabled: ui.b.disabled,
                b_background: ui.b.style.background,
                picker_options: pickerOptionsStr,
                picker_disabled: ui.picker.disabled,
                picker_selectedIndex: ui.picker.selectedIndex
                
            });
        }
    });
    
    port.onDisconnect.addListener(function()
    {
      // TODO: Disable UI
      port = null;
      //console.log("shutdown");
      onAppWindowClosed();
    });
    
    //console.log('Initilaizing Blink(1) App: complete');
});

/*
// Don't open a control windows for this app
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "color-picker.html", {
        id: "blink1",
        innerBounds: { width: 160, height: 115 },
        resizable: false
      }, onAppWindowCreated);

});
*/

function enableControls(enabled) {
    ui.r.disabled = !enabled;
    ui.g.disabled = !enabled;
    ui.b.disabled = !enabled;
};

function onDevicesEnumerated(devices) {
    if (chrome.runtime.lastError) {
        console.error("Unable to enumerate devices: " +
            chrome.runtime.lastError.message);
        return;
    }

    for (var device of devices) {
        onDeviceAdded(device);
    }
}

function onDeviceAdded(device) {
    if (device.vendorId != Blink1.VENDOR_ID ||
        device.productId != Blink1.PRODUCT_ID) {
        return;
    }
    
    var blink1 = new Blink1(device.deviceId);
    blink1.connect(function(success) {
        if (success) {
            blink1.getVersion(function(version) {
                if (version) {
                    blink1.version = version;
                    addNewDevice(blink1);
                }
            });
        }
    });
}

function onDeviceRemoved(deviceId) {
    var option = ui.picker.options.namedItem('device-' + deviceId);
    if (!option) {
        return;
    }
    if (option.selected) {
        bg.blink1.disconnect(function() {});
        bg.blink1 = undefined;
        enableControls(false);
        if (option.previousSibling) {
            option.previousSibling.selected = true;
        }
        if (option.nextSibling) {
            option.nextSibling.selected = true;
        }
    }
    ui.picker.remove(option.index);
    if (ui.picker.options.length == 0) {
        var empty = document.createElement('option');
        empty.text = 'No devices found.';
        empty.id = 'empty';
        empty.selected = true;
        ui.picker.add(empty);
        ui.picker.disabled = true;
    } else {
        switchToDevice(ui.picker.selectedIndex);
    }
}

function addNewDevice(blink1) {
    var firstDevice = ui.picker.options[0].id == 'empty';
    var option = document.createElement('option');
    option.text = blink1.deviceId + ' (version ' + blink1.version + ')';
    option.id = 'device-' + blink1.deviceId;
    ui.picker.add(option);
    ui.picker.disabled = false;
    if (firstDevice) {
        ui.picker.remove(0);
        option.selected = true;
        setActiveDevice(blink1);
    } else {
        blink1.disconnect(function() {});
    }
}

function setActiveDevice(blink1) {
    bg.blink1 = blink1;

    bg.blink1.getRgb(0, function(r, g, b) {
        ui.r.value = r || 0;
        ui.g.value = g || 0;
        ui.b.value = b || 0;
        setGradients();
        bg.blink1.fadeRgb(ui.r.value, ui.g.value, ui.b.value, 250, 0);
    });
    enableControls(true);
}

function switchToDevice(optionIndex) {
    var deviceId =
        parseInt(ui.picker.options[optionIndex].id.substring(7));
    var blink1 = new Blink1(deviceId);
    blink1.connect(function(success) {
        if (success) {
            setActiveDevice(blink1);
        }
    });
}

function onSelectionChanged() {
    bg.blink1.disconnect(function() {});
    bg.blink1 = undefined;
    enableControls(false);
    switchToDevice(ui.picker.selectedIndex);
}

function onColorChanged() {
    setGradients();
    bg.blink1.fadeRgb(ui.r.value, ui.g.value, ui.b.value, 250, 0);
}

function setGradients() {
    var r = ui.r.value,
        g = ui.g.value,
        b = ui.b.value;
    ui.r.style.background =
        'linear-gradient(to right, rgb(0, ' + g + ', ' + b + '), ' +
        'rgb(255, ' + g + ', ' + b + '))';
    ui.g.style.background =
        'linear-gradient(to right, rgb(' + r + ', 0, ' + b + '), ' +
        'rgb(' + r + ', 255, ' + b + '))';
    ui.b.style.background =
        'linear-gradient(to right, rgb(' + r + ', ' + g + ', 0), ' +
        'rgb(' + r + ', ' + g + ', 255))';
}


/* Blink Code follows */

function Blink1(deviceId) {
    this.deviceId = deviceId;
    this.connection = null;
};

Blink1.VENDOR_ID = 0x27B8;
Blink1.PRODUCT_ID = 0x01ED;

Blink1.prototype.connect = function(cb) {
    chrome.hid.connect(this.deviceId, function(connectionInfo) {
        if (chrome.runtime.lastError) {
            console.warn("Unable to connect device: " +
                chrome.runtime.lastError.message);
            cb(false);
            return;
        }

        this.connection = connectionInfo.connectionId;
        cb(true);
    }.bind(this));
};

Blink1.prototype.disconnect = function(cb) {
    chrome.hid.disconnect(this.connection, function() {
        if (chrome.runtime.lastError) {
            console.warn("Unable to disconnect device: " +
                chrome.runtime.lastError.message);
            cb(false);
            return;
        }

        cb(true);
    }.bind(this));
};

// The following functions send commands to the blink(1). The command protocol
// operates over feature reports and is documented here:
//
// https://github.com/todbot/blink1/blob/master/docs/blink1-hid-commands.md
//
// blink(1) HID feature reports are 8 bytes, though only the first 7 bytes
// appear to ever be read by the firmware. 8 bytes must be sent because some
// platforms require it (Windows). The documentation refers to sending the
// report ID as the first byte of the buffer, this is a detail of the HID
// transport layer and the firmware's HID library and is not reflected in the
// buffers sent here. This confusion is probably why the firmware only uses the
// first 7 bytes of the report.
//
// Be careful not to send multiple commands simultaneously as each command
// overwrites the buffer returned by a GET_REPORT(Feature) request and so the
// command result may be lost or misattributed.
//
// TODO(reillyeon): Add transparent request queueing to prevent this.

Blink1.prototype.fadeRgb = function(r, g, b, fade_ms, led) {
    var fade_time = fade_ms / 10;
    var th = (fade_time & 0xff00) >> 8;
    var tl = fade_time & 0x00ff;
    var data = new Uint8Array(8);
    data[0] = 'c'.charCodeAt(0);
    data[1] = r;
    data[2] = g;
    data[3] = b;
    data[4] = th;
    data[5] = tl;
    data[6] = led;
    chrome.hid.sendFeatureReport(this.connection, 1, data.buffer, function() {
        if (chrome.runtime.lastError) {
            console.warn("Unable to send fade command: " +
                chrome.runtime.lastError.message);
        }
    });
};

Blink1.prototype.getRgb = function(led, cb) {
    var data = new Uint8Array(8);
    data[0] = 'r'.charCodeAt(0);
    data[6] = led;
    chrome.hid.sendFeatureReport(this.connection, 1, data.buffer, function() {
        if (chrome.runtime.lastError) {
            console.warn("Unable to send get command: " +
                chrome.runtime.lastError.message);
            cb(undefined, undefined, undefined);
            return;
        }

        chrome.hid.receiveFeatureReport(this.connection, 1, function(buffer) {
            if (chrome.runtime.lastError) {
                console.warn("Unable to read get response: " +
                    chrome.runtime.lastError.message);
                cb(undefined, undefined, undefined);
                return;
            }

            var data = new Uint8Array(buffer);
            cb(data[2], data[3], data[4]);
        });
    }.bind(this));
};

Blink1.prototype.getVersion = function(cb) {
    var data = new Uint8Array(8);
    data[0] = 'v'.charCodeAt(0);
    chrome.hid.sendFeatureReport(this.connection, 1, data.buffer, function() {
        if (chrome.runtime.lastError) {
            console.warn("Unable to send version command: " +
                chrome.runtime.lastError.message);
            cb(undefined);
            return;
        }

        chrome.hid.receiveFeatureReport(this.connection, 1, function(buffer) {
            if (chrome.runtime.lastError) {
                console.warn("Unable to read version response: " +
                    chrome.runtime.lastError.message);
                cb(undefined);
                return;
            }

            var data = new Uint8Array(buffer);
            cb(String.fromCharCode(data[3]) + "." + String.fromCharCode(data[4]));
        });
    }.bind(this));
};
