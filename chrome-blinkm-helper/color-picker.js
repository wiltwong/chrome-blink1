(function() {
  var ui = {
    picker: null,
    r: null,
    g: null,
    b: null
  };

  var bg = undefined;
  
  var port;

  function initializeWindow() {
    for (var k in ui) {
      var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
      var element = document.getElementById(id);
      if (!element) {
        throw "Missing UI element: " + k;
      }
      ui[k] = element;
    }
    setGradients();
    ui.picker.addEventListener('change', onSelectionChanged);
    ui.r.addEventListener('input', onColorChanged);
    ui.g.addEventListener('input', onColorChanged);
    ui.b.addEventListener('input', onColorChanged);
    
    if (!port) {
        port = chrome.runtime.connect();
        port.onDisconnect.addListener(function()
        {
          // TODO: Disable UI
          enableControls(false);
          port = null;
        });
    }
    
    port.onDisconnect.addListener(function()
    {
      port = null;
    });
    
    port.onMessage.addListener(function(msg) {
        //console.log(msg);
        if (msg.event == 'status') {
            ui.r.value = msg.r_value;
            //ui.r.disabled = msg.r_disabled;
            ui.r.disabled = true;
            ui.r.style.background = msg.r_background;
            ui.g.value = msg.g_value;
            //ui.g.disabled = msg.g_disabled;
            ui.g.disabled = true;
            ui.g.style.background = msg.g_background;
            ui.b.value = msg.b_value;
            //ui.b.disabled = msg.b_disabled;
            ui.b.disabled = true;
            ui.b.style.background = msg.b_background;
            
            var pickerOptions = JSON.parse(msg.picker_options);
            ui.picker.length = 0;
            for (var k=0; k<pickerOptions.length; k++) {
                var option = document.createElement('option');
                option.text = pickerOptions[k].text;
                option.id = pickerOptions[k].id;
                ui.picker.add(option);
            }
            
            //ui.picker.disabled = msg.picker_disabled;
            ui.picker.disabled = true;
            ui.picker.selectedIndex = msg.picker_selectedIndex;
        }
    });
  };

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
  
  function onSelectionChanged() {
    
  }

  function onColorChanged() {
    
  }
  
  window.addEventListener('load', function() {
    // Once the background page has been loaded, it will not unload until this
    // window is closed.
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
      bg = backgroundPage;
      initializeWindow();
    });
  });
}());
