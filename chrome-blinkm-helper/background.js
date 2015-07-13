var tabToUrl = {};
var port;
var iport;
var chromeAppId = 'nmlkacdampdnbcnelilbfaglbdmggcfm';

// Add a listener so background knows when a tab has changed.
// You need 'tabs' persmission, that's why we added it to manifest file.

//chrome.tabs.onCreated.addListener(showControlPanelOnCreatedAction);
chrome.tabs.onReplaced.addListener(showControlPanelOnReplacedAction)
chrome.tabs.onUpdated.addListener(showControlPanelOnUpdatedAction);
chrome.tabs.onRemoved.addListener(shutdownAction);

chrome.runtime.onConnect.addListener(function(internalPort) {
	//console.log('Initilaizing Blink(1) Helper');
	
	iport = internalPort;
	
	/*
	internalPort.onMessage.addListener(function(msg) {
		console.log(msg);
	});
	*/
	
	internalPort.onDisconnect.addListener(function()
	{
	  internalPort = null;
	  iport = internalPort;	  
	});
	
	port.onMessage.addListener(function(msg) {
		//console.log(msg);
		if (msg.event == 'status' && iport) {
			iport.postMessage({
				event: "status", 
				r_value: msg.r_value, 
				r_disabled: msg.r_disabled,
				r_background: msg.r_background,
				g_value: msg.g_value, 
				g_disabled: msg.g_disabled,
				g_background: msg.g_background,
				b_value: msg.b_value, 
				b_disabled: msg.b_disabled,
				b_background: msg.b_background,
				picker_options: msg.picker_options,
				picker_disabled: msg.picker_disabled,
				picker_selectedIndex: msg.picker_selectedIndex
			});
		}
	});
	
	var status = function() {
		if (port) {
			port.postMessage({event: "status"});
			//setTimeout(status(), 1000);
		} else {
			return;
		}
	};
	status();
});

function shutdownAction(tabId, removeInfo) {
  if (typeof tabToUrl[tabId] != 'undefined') {
	//console.log("shutdown");
    delete tabToUrl[tabId];
	if (!port) {
		port = chrome.runtime.connect(chromeAppId);
		port.onDisconnect.addListener(function()
		{
		  // TODO: Disable UI
		  port = null;
		});
	}
	port.postMessage({event: "hangout-shutdown"});
  }
};

// onUpdated does not fire when the page is retrived from cache
function showControlPanelOnReplacedAction(addedTabId, removedTabId) {
  //alert('showControlPanelOnReplacedAction');
  // Check if the old tab was a hangouts tab
  if (typeof tabToUrl[removedTabId] != 'undefined') {
    // we are moving away from a hangouts page
    if (tabToUrl[removedTabId].indexOf('plus.google.com/hangouts') > -1) {
      delete tabToUrl[removedTabId];
      if (!port) {
        port = chrome.runtime.connect(chromeAppId);
		port.onDisconnect.addListener(function()
		{
		  // TODO: Disable UI
		  port = null;
		});
      }
	  port.postMessage({event: "hangout-shutdown"});
    }
  }
};

function updateTabToUrl(tab) {
  if (tab.url.indexOf('plus.google.com/hangouts') > -1) {
      tabToUrl[tabId] = tab.url;
      chrome.pageAction.show(tabId);
	  
      // Check if the app is installed and enabled by opening a messaging port
      if (!port) {
        port = chrome.runtime.connect(chromeAppId);
        port.onDisconnect.addListener(function()
        {
          // TODO: Disable UI
		  port = null;
        });
      }
	  port.postMessage({event: "hangout-startup"});
  }
};

//function showControlPanelOnCreatedAction(tab) {
//  if (tab.url.indexOf('plus.google.com/hangouts') > -1) {
//    tabToUrl[tabId] = tab.url;
//    chrome.pageAction.show(tabId);
//  }
//};

function showControlPanelOnUpdatedAction(tabId, changeInfo, tab) {
  //alert('showControlPanelOnUpdatedAction');
  
  if (tab.url.indexOf('plus.google.com/hangouts') > -1) {
    tabToUrl[tabId] = tab.url;
    if (changeInfo.status == 'complete') {
      // Show icon for page action in the current tab.
      chrome.pageAction.show(tabId);
      // Check if the app is installed and enabled by opening a messaging port
      if (!port) {
        port = chrome.runtime.connect(chromeAppId);
        port.onDisconnect.addListener(function()
        {
          // TODO: Disable UI
		  port = null;
        });
      }
	  port.postMessage({event: "hangout-startup"});
    }
  }
  
  if (typeof tabToUrl[tabId] != 'undefined') {
	if ((tabToUrl[tabId].indexOf('plus.google.com/hangouts') > -1) && !(tab.url.indexOf('plus.google.com/hangouts') > -1)) {
		// we are browsing away from the hangout
		delete tabToUrl[tabId];

		if (!port) {
			port = chrome.runtime.connect(chromeAppId);
			port.onDisconnect.addListener(function()
			{
			  // TODO: Disable UI
			  port = null;
			});
		}
		port.postMessage({event: "hangout-shutdown"});
	}
  }
};
