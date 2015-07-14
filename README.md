# chrome-blink1

**TL;DR** When you navigate to a Google Hangout URL, the extention and application light up the [ThingM blink(1) mk2](http://blink1mk2.thingm.com/) RGB LED red to indicate that you are "on-air". when you navigate away from a Google Hangout URL, it shuts down the RGB LED.

These extentions and applications use the `chrome.hid` API by controlling a [ThingM blink(1) mk2](http://blink1mk2.thingm.com/) RGB LED light via USB HID Feature Reports.

Due to security and design restrictions within Chrome there are two segements of the overall implementation:

* **chrome-blinkm**: This is a chrome application that interfaces with the actual hardware via the USB HID
* **chrome-blinkm-helper**: This is a chrome extention that interfaces with the browser and provides an interface to the chrome chrome-blinkm application

Chrome allows applications to access USB devices, but does not allow them to interact with the browsing windows or access the browser tab information. However, Chrome allows extentions to access the browsing windows and browser tb information. The combination of the application and extension provide us the ability to detect when a URL matches a specific pattern, which in turn contols the RGB LED light.

The helper extention and the application is based on [code](https://github.com/googlechrome/chrome-app-samples) that was developed for the blink(1) by the Chrome team.

## APIs

* [HID](https://developer.chrome.com/apps/hid)
* [Runtime](https://developer.chrome.com/apps/app_runtime)
* [Tabs](https://developer.chrome.com/extensions/tabs)
* [Message Passing](https://developer.chrome.com/extensions/messaging)

## Install

There are a few different ways you can install chrome-blink1:

* Download the zipfile from the [releases](https://github.com/wiltwong/chromw-blink1/releases) page and install it by uncompressing the zip file and dragging and dropping the two CRX files into your chrome://extentions
* Checkout the source: `git clone git://github.com/wiltwong/chrome-blink1.git` and install it by draging and dropping the two CRX files into your chrome://extentions
* Checkout the source for development: `git clone git://github.com/wiltwong/chrome-blink1.git`, enable developer mode in your chrome://extentions and load the app and extention using the "Load unpacked extention..." button. You will need to copy the generated App id from the "chrome-blinkm" application to the chrome-blinkm-helper/background.js file in the "chrome-blinkm-helper" extention.

### Running this on Linux

On Linux a udev rule must be added to allow Chrome to open the blink(1) device. Copy the file [`udev/61-blink1.rules`](https://raw.githubusercontent.com/GoogleChrome/chrome-app-samples/master/blink1/udev/61-blink1.rules) to `/etc/udev/rules.d`. It contains the following rule which allows anyone in the `plugdev` group read/write access the `hidraw` node for this device. See [USB Caveats](https://developer.chrome.com/apps/app_usb#caveats) for more details.

    # Make the blink(1) accessible to plugdev via hidraw.
    SUBSYSTEM=="hidraw", SUBSYSTEMS=="usb", ATTRS{idVendor}=="27b8", ATTRS{idProduct}=="01ed", MODE="0660", GROUP="plugdev"

### Design Notes

The chrome-blinkm-helper extension has two parts, a background process that looks for changes in the tab URLs and matches it against the Google Hangout URL of 'plus.google.com/hangouts'. When a match is found, an icon is created in the corresponding tab that contains a popup that shows information about the attached blink(1) device, if one is attached. The background process is required since the popup is not loaded/executed until the icon is clicked. In addtion to creating the UI element, the extension opens a communication channel to the chrome-blinkm appliacation (starting the application if it hasn't already started). When the chrome-blinkm starts, it opens the USB devices and scans for blink(1) devices and if one is found it sets the colour to red. When the chrome-blinkm-helper popup is clicked and rendered, a "status" request is sent from the popup to the background process which is then relayed to the chrome-blinkm application. The chrome-blinkm application then responds by sending the staus back to the chrome-blinkm-helper background process which in turn relays that message to the popup, the popup then renders the appropriate UI elements.

### TODO

* General code cleanup
* Re-implement the chrome-blinkm application to use simpler structures and variables instead of using document elements in a hidden background process (implemented this way since the orginal code used a "real UI" and it was easier to create the HTML in memory
* Implement controls and control messages so that the LED can be controlled by the chrome-blinkm-helper popup
* Implement state saving so that we can restore the original state before activating the "on-air" light
* Add additional features for monitoring other sites like setting up notifications for gmail or calendar events
* Add controls for customizing the RGB LED (e.g. cycling colour or blinking notifications)

