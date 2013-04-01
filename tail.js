var tail_source_tab = null;
var tail_source_interval = 0;

var tail_read_position = 0;
var tail_current_text = null;
var tail_display_lock = false;


chrome.browserAction.onClicked.addListener(function(tab){
    if( tail_source_tab === null && tab.url.indexOf('file://') == 0){
        tail_source_tab = tab;
        chrome.browserAction.setIcon({path:"images/icon-active.png"});
        tail_source_interval = setInterval(checkFile,500);

        // connect.
        _WS.init();
    }else{
        chrome.browserAction.setIcon({path:"images/icon-inactive.png"});
        clearInterval(tail_source_interval);
        tail_source_tab = null;

        // close
        _WS.close();
    }
})

var _WS = {
    //websoket port (will be replaced by SublimeSocket plugin)
    uri: 'ws://127.0.0.1:8823/',
    
    ws: null,

    init : function (e) {
      _WS.s = new WebSocket(_WS.uri);
      _WS.s.onopen = function (e) { _WS.onOpen(e); };
      _WS.s.onclose = function (e) { _WS.onClose(e); };
      _WS.s.onmessage = function (e) { _WS.onMessage(e); };
      _WS.s.onerror = function (e) { _WS.onError(e); };
    },

    onOpen: function () {
        identityJSON = {
            "id":"chrometailsocket"
        };

        showAtLogJSON = {
            "message": "chrometailsocket connected to SublimeSocket."
        };

        showStatusMessageJSON = {
            "message": "chrometailsocket connected to SublimeSocket."
        };

        runSettingJSON = {
            "path":"/Users/sassembla/Library/Application Support/Sublime Text 2/Packages/SublimeSocket/FilterSettingSamples/TypeScriptFilter.txt"
        };

        //call api then get callback
        _WS.s.send('sublimesocket@inputIdentity:'+JSON.stringify(identityJSON)+
            "->showAtLog:"+JSON.stringify(showAtLogJSON)+
            "->showStatusMessage:"+JSON.stringify(showStatusMessageJSON)+
            "->runSetting:"+JSON.stringify(runSettingJSON)
        );
    },

    onClose: function () {
        console.log("closed!!?");
        // _WS.writeLog('<span class="label label-important">RESPONSE:DISCONNECTED</span>');
    },

    onMessage: function (e) {
        // _WS.writeLog('<span class="label label-success">RESPONSE: ' + e.data + '</span>');
    },

    onError: function (e) {
        // _WS.writeLog('<span style="color: red;">ERROR:</span> ' + e.data);
    },


    send: function (message) {
        if (!message.length) {
            alert('Empty message not allowed !');
        } else {
            _WS.s.send(message);
        }
    },
    close: function () {
        console.log("close!!");
        _WS.s.close();
    }
};



function checkFile(){
    if( tail_source_tab == null ){
        return;
    }
    
    chrome.tabs.reload(tail_source_tab.id);
    
    chrome.tabs.executeScript(
        tail_source_tab.id, {code:'document.body.innerText'}, function(result){
            if( tail_display_lock == true ){
                return;
            }

            if( tail_current_text !== null ){
              tail_current_text = result[0].substr(tail_read_position);
            }else{
                tail_current_text = '';
            }

            tail_read_position = result[0].length;
            if( tail_current_text == '' ){
                return;
            }
            chrome.windows.getAll(
                function(windows){
                    for( var i = 0; i < windows.length; i++ ){
                        chrome.tabs.getAllInWindow(
                            window.id, function(tabs){
                                for( var j = 0; j < tabs.length; j++ ){
                                    if( tabs[j].url.indexOf('file') == 0 || tabs[j].url.indexOf('http') == 0 ){
                                        if( tail_current_text != '' ){
                                            _WS.s.send("ss@"+tail_current_text);//行分解が必要。
                                        }
                                    }
                                }
                                tail_current_text = '';
                                tail_display_lock = false;
                            }
                        )
                    }
                }
            )
        }
    );
}

