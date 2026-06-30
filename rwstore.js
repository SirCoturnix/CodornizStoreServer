


"use strict";



var _OM = null;

var LM = {
    error: 1,
    warning: 2,
    info: 3,
    verbose: 4,
};

var wsWindow = null;
var wsOrigin = "*";
var wsAppxOrigin = "ms-appx://MasterCoturnix";
var navArgs = [];
var isNavInProgress = false;
var navTimeout = 0;
var canInitSplashScreen = true;
var splashScreen = null;
var iframeToShow = null;
var currentViewState = null;
var animationsEnabled = false;
var messageDialogAsyncOperation = null;
var isErrorPageVisible = true;
var lastUpdateCount = 0;


function logConsole(logType, msg) {
    


function logMessage(logType, msg) {
    logConsole(logType, msg);
    if (_OM) {
        _OM.nativeOM.logMessage(logType, msg);
    }
}

function unhandledException(errMsg, errUrl, errLine) {
    var msg = errUrl + ": line " + errLine + ": " + errMsg;
    logMessage(LM.error, "!! Unhandled exception: " + msg);
    MSApp.terminateApp({ number: 0, stack: "", description: msg });
}

function saveOrigin(frameUrl) {
    var parts = frameUrl.match(/^\w+:\/\/[^\/\?]+/);
    if (parts) {
        wsOrigin = parts[0].toLowerCase(); 
    } else {
        wsOrigin = "*";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    _OM = new OMStub();
    _OM.loggingLevel = _OM.nativeOM.loggingLevel;

    window.onerror = function (errMsg, errUrl, errLine) {
        unhandledException(errMsg, errUrl, errLine);
    }

    Windows.UI.WebUI.WebUIApplication.addEventListener("activated", function (args) {
        if (!_OM.initialized) {
            Windows.Graphics.Display.DisplayProperties.autoRotationPreferences =
                Windows.Graphics.Display.DisplayOrientations.landscape |
                Windows.Graphics.Display.DisplayOrientations.landscapeFlipped |
                Windows.Graphics.Display.DisplayOrientations.portrait |
                Windows.Graphics.Display.DisplayOrientations.portraitFlipped;
        }

        window.setImmediate(onActivatedTimeout, args); 

        if (canInitSplashScreen) {
            canInitSplashScreen = false; 
            splashScreen = args.splashScreen;
            resizeSplashScreen();
        }
    }, false);

    Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", function (args) {
        _OM.registerCallbacks();
        if (wsWindow) {
            wsWindow.postMessage({ method: "resumeEvent" }, wsOrigin);
        }
    }, false);

    Windows.UI.WebUI.WebUIApplication.addEventListener("suspending", function (args) {
        if (wsWindow) {
            if (args.suspendingOperation) {
                _OM.suspendDefferal = args.suspendingOperation.getDeferral();
            }
            wsWindow.postMessage({ method: "suspendEvent" }, wsOrigin);
        }
        _OM.unregisterCallbacks();
    }, false);

    window.addEventListener("message", onMessage, false);
    window.addEventListener("keyup", onKeyUpFrame, false);
    window.addEventListener("keypress", onKeyPressFrame, false);
    window.addEventListener("resize", onResize, false);
    window.addEventListener("MSPointerUp", onMSPointerUpFrame, false);

    
    document.addEventListener("visibilitychange", function () {
        _OM.loggingLevel = _OM.nativeOM.loggingLevel;
        logMessage(LM.info, "visibilityState changed to: " + document.msVisibilityState);
        if (document.visibilityState == "visible") {
            _OM.nativeOM.clearErrorPage();
        }
    }, false);

    getSystemAnimationSetting();

    initWinStoreHtm();
}, false);

function onActivatedTimeout(args) {
    if (!_OM.initialized) {
        _OM.initialized = true;
        _OM.nativeOM.initialize();

        var edgy = Windows.UI.Input.EdgeGesture.getForCurrentView();
        if (edgy) {
            edgy.addEventListener("starting", function () { _OM.onEdgy("starting"); });
            edgy.addEventListener("completed", function () { _OM.onEdgy("completed"); });
            edgy.addEventListener("canceled", function () { _OM.onEdgy("canceled"); });
        }
    }

    _OM.nativeOM.onActivationEvent(args);

    
    if (args.detail.arguments === "RetailExperience") {
        MSApp.terminateApp({ number: 0, stack: "", description: "RetailExperience" });
    }
}


function cancelModalDialogs() {
    if (messageDialogAsyncOperation) {
        messageDialogAsyncOperation.cancel();
        messageDialogAsyncOperation = null;
    }
    _OM.nativeOM.dismissLiveAuthenticationDialog();
}


function onMessage(msg) {
    if (msg.origin.toLowerCase() === wsOrigin ||
        msg.origin.toLowerCase() === wsAppxOrigin) {
        var args = msg.data;
        if (args) {
            var fn = _OM[args.method];
            if (fn) {
                var r = fn.call(_OM, args, msg);
                if (r !== undefined) { 
                    postResult(r, args, msg);
                }
            } else if (args.method === "WS") {
                if (args.event === "open") {
                    wsWindow = msg.source;
                    clearNavTimeout();
                    _OM.onIFrameLoaded();
                    startPendingNavigation();
                } else if (args.event === "close") {
                    _OM.unregisterCallbacks();
                    lastUpdateCount = 0;
                    wsWindow = null;
                }
            } else {
                logMessage(LM.warning, "Unknown local message: " + JSON.stringify(args));
            }
        }
    } else {
        logMessage(LM.warning, "Unknown local message origin: " + msg.origin);
    }
}


function initWinStoreHtm() {
    var appName = _OM.nativeOM.loadStringResource(1); 
    var pageTitle = document.getElementById("errorPageTitle");
    if (pageTitle) {
        pageTitle.innerText = appName;
    }
    var backButton = document.getElementById("errorBackButton");
    if (backButton) {
        backButton.title = _OM.nativeOM.loadStringResource(16); 
        backButton.addEventListener("click", function () { onBackButtonClicked(); });
        if (window.getComputedStyle(backButton, null).direction === "rtl") {
            backButton.className = "win-backbutton flipButton";
        }
    }
}

function clearNavTimeout() {
    if (navTimeout !== 0) {
        window.clearTimeout(navTimeout);
        navTimeout = 0;
    }
}

function startPendingNavigation() {
    if (wsWindow && !isNavInProgress) {
        var args = navArgs.shift();
        if (args) {
            isNavInProgress = true;
            wsWindow.postMessage(args, wsOrigin);
        }
    }
}

function navigateAjax(href, isNavBack) {
    if (_OM && _OM.initialized) {
        logMessage(LM.info, "navigateAjax: Loading file: " + href);
        _OM.nativeOM.getFile(href, function (contents) {
            
            logMessage(LM.info, "navigateAjax: Response received; href = " + href);
            var paramsIndex = href.indexOf("?");
            var params = (-1 !== paramsIndex) ? href.slice(paramsIndex) : null;
            var args = {
                method: "navigateAjax",
                params: params,
                isNavBack: isNavBack,
                html: contents
            };
            
            navArgs.push(args);
            startPendingNavigation();

            
            if (!wsWindow) {
                
                navTimeout = window.setTimeout(function () {
                    logMessage(LM.warning, "navigateAjax: WS-open not received; showing connection error message.");
                    _OM.nativeOM.navigateToErrorPage(_OM.nativeOM.loadStringResource(6)); 
                    var e = document.getElementById("WS");
                    if (e) {
                        document.body.removeChild(e);
                    }
                }, 500);
            }
        });
    } else if (_OM) {
        logMessage(LM.error, "navigateAjax: called to load file before init was done: " + href);
    }

}

function ariaHideErrorPage(hideNodes) {
    var attributeValue = hideNodes ? "true" : "false",
        nodeIds = ["errorBackButton", "errorPageTitle", "errorMsg"];

    nodeIds.forEach(function (nodeId) {
        var node = document.getElementById(nodeId);
        if (node) {
            node.setAttribute("aria-hidden", attributeValue);
        }
    });
};
function navigateUI(href, isNavBack, iframeId) {  
    if (iframeId === "top") {
        
        window.location = href;
    } else if (_OM) {
        
        logMessage(LM.info, "navigateUI: Navigating 'WS' iframe to " + href);
        if (isErrorPageVisible) {
            ariaHideErrorPage(true);
        }
        cancelModalDialogs();
        isErrorPageVisible = false;
        var frameUrl = null;
        if (_OM.initialized) {
            frameUrl = _OM.frameUrl();
        }
        
        var iframe = document.getElementById("WS");
        if (iframe === null || (frameUrl && (frameUrl !== iframe.src.toLowerCase()))) {
            
            var newFrame = document.createElement("iframe");
            newFrame.id = newFrame.name = "WS";
            if (splashScreen) {
                
                newFrame.style.opacity = 0;
                iframeToShow = newFrame;
            }
            newFrame.src = frameUrl;
            newFrame.addEventListener("load", function () { navigateAjax(href, false); }, false);
            
            if (iframe) {
                newFrame.style.opacity = 0;
                logMessage(LM.info, "navigateUI: Removing iframe '" + iframe.id + "' with " + iframe.src);
                
                iframe.id = iframe.id + "ToDelete";
                hideWSFrame(iframe.id, newFrame.id);
                wsWindow = null;
            }
            saveOrigin(frameUrl);
            logMessage(LM.info, "navigateUI: Creating 'WS' iframe with " + newFrame.src);
            document.body.appendChild(newFrame);
        } else {
            if (iframe.style.display === "none") {
                iframe.style.display = "inline";
            }
            ariaHideErrorPage(true);
            navigateAjax(href, isNavBack);
        }
    }

}

function onBackButtonClicked() {
    _OM.goBack();
}

function showErrorPage(message, fShowBackButton) {
    MSApp.execUnsafeLocalFunction(function () { errorMsg.innerHTML = message; });
    var backButton = document.getElementById("errorBackButton");
    if (backButton) {
        backButton.style.display = fShowBackButton ? "block" : "none";
    }
    var e = document.getElementById("linkRefresh");
    if (e) {
        e.addEventListener("click", function () { if (_OM) { _OM.nativeOM.refreshLastPage(); } }, false);
    } else {
        e = document.getElementById("linkHome");
        if (e) {
            e.addEventListener("click", function () { if (_OM) { _OM.nativeOM.showHomePage(); } }, false);
        } else {
            e = document.getElementById("linkResetWindows");
            if (e) {
                e.addEventListener("click", function () { if (_OM) { _OM.nativeOM.showResetWindows(); } }, false);
            } else {
                e = document.getElementById("linkRepairLOBKey");
                if (e) {
                    e.addEventListener("click", function () { if (_OM) { _OM.nativeOM.repairLOBKey(); } }, false);
                }
            }
        }
    }
    ariaHideErrorPage(false);
    if (e) {
        e.tabIndex = 0;
    }
    
    cancelModalDialogs();
    hideWSFrame();
    iframeToShow = null;
    clearNavTimeout();
    navArgs = [];               
    isNavInProgress = false;
    hideSplashScreen(true);
    isErrorPageVisible = true;
}

function sendUpdateCount() {
    if (wsWindow) {
        var updateArgs = {
            method: "updateCountEvent",
            
            updateCount: { asNumber: lastUpdateCount, asString: _OM.nativeOM.formatNumber(lastUpdateCount) }
            
        };
        wsWindow.postMessage(updateArgs, wsOrigin);
    }
}


function HandleMessageFromNative(msgId, uParam, strParam) {
    var args = tryParse(strParam);
    switch (msgId) {
    case 0: 
        if (args) {
            if (uParam === 0) {
                navigateUI(args.url, args.isNavBack, args.frame);
            } else if (uParam === 1) {
                showErrorPage(args.errorMessage, args.showBackButton);
            }
        }
        break;
    case 1: 
        lastUpdateCount = uParam;
        sendUpdateCount();
        break;
    case 2: 
        if (wsWindow && args) {
            
            wsWindow.postMessage({method: "installProgressEvent", progressData: args.summary}, wsOrigin);
            wsWindow.postMessage({method: "downloadManagerEvent", progressData: args.detail}, wsOrigin);
        }
        break;
    case 3: 
        if (wsWindow && args) {
            wsWindow.postMessage({method: "licensedAppsEvent", licensedApps: args}, wsOrigin);
        }
        break;
    case 4: 
        if (wsWindow && args) {
            wsWindow.postMessage({method: "purchaseProgressEvent", progressData: args}, wsOrigin);
        }
        break;
    case 5: 
        _OM.redeemStoredValueToken({ csvToken: "silentredeem" });
        break;
    }
}

function hideWSFrame(idToHide, idToShow) {
    if (wsWindow) {
        var args = {
            method: "navigateAjax",
            params: null,
            isNavBack: false,
            idToHide: (idToHide ? idToHide : "WS"),
            idToShow: (idToShow ? idToShow : "WS"),
            html: "errorPage"
        };
        wsWindow.postMessage(args, wsOrigin);
    } else if (!idToHide && !idToShow) {
        
        var iframe = document.getElementById("WS");
        if (iframe) {
            document.body.removeChild(iframe);
        }
    }
}

function hideFrameForDemo() {
    var iframe = document.getElementById("WSToDelete");
    if (iframe) {
        document.body.removeChild(iframe);
    }
    iframe = document.getElementById("WS");
    if (iframe) {
        iframe.style.opacity = 1;
    }
}

function resizeSplashScreen() {
    if (splashScreen) {
        var rc = splashScreen.imageLocation;
        var logo = document.getElementById("splashLogo");
        logo.style.left = rc.x + "px";
        logo.style.top = rc.y + "px";
        logo.style.width = rc.width + "px";
        logo.style.height = rc.height + "px";

        var content = document.getElementById("splashContent");
        content.style.left = logo.style.left;
        content.style.width = logo.style.width;
        content.style.top = (rc.y + rc.height) + "px";
    }
}

function hideSplashScreen(fForceHide) {
    
    canInitSplashScreen = false;

    if (splashScreen || fForceHide) {
        if (iframeToShow) {
            iframeToShow.style.opacity = 1;
            iframeToShow = null;
        }

        var splashDiv = document.getElementById("splash");
        if (splashDiv) {
            document.body.removeChild(splashDiv);
        }
        splashScreen = null;
    }
}


function getSystemAnimationSetting() {
    try {
        var animationSettings = new Windows.UI.ViewManagement.UISettings();
        animationsEnabled = animationSettings.animationsEnabled;
    } catch (ex) {
        if (_OM) {
            logMessage(LM.error, "getSystemAnimationSetting: exception = " + ex.name + ": " + ex.message);
        }
    }
}

function navBackKeyClicked() {
    if (isErrorPageVisible) {
        var backButton = document.getElementById("errorBackButton");
        if (backButton && (backButton.style.display !== "none") && _OM) {
            logMessage(LM.info, "Navigate back key clicked on error page - invoking Back button");
            onBackButtonClicked();
        }
    } else if (wsWindow) {
        
        var args = {
            method: "navBackKeyClicked"
        };
        wsWindow.postMessage(args, wsOrigin);
    }
}

function onKeyUpFrame(e) {
    if ("Enter" === e.key || "Spacebar" === e.key) {
        if (isErrorPageVisible) {
            
            var focusElement = document.activeElement;
            if (focusElement && (focusElement.tagName.toLowerCase() !== "button")) {
                var clickEvent = document.createEvent("Event");
                clickEvent.initEvent("click", true, true);
                focusElement.dispatchEvent(clickEvent);
            }
        }
    } else if (((e.key === "Left") && e.altKey) || (e.key === "BrowserBack")) {
        navBackKeyClicked();
    }
}


function onKeyPressFrame(e) {
    if ("Backspace" === e.key) {
        navBackKeyClicked();
    } else if (e.key === "e" && e.ctrlKey && wsWindow) {
        
        var args = {
            method: "focusSearchBox"
        };
        wsWindow.postMessage(args, wsOrigin);
    }
}

function onResize() {
    var viewState = Windows.UI.ViewManagement.ApplicationView.value;
    if (currentViewState !== viewState) {
        currentViewState = viewState;
        if (_OM) {
            logMessage(LM.info, "Switched to view state: " + getViewStateName(viewState));
        }
    }

    resizeSplashScreen();
}

function onMSPointerUpFrame(e) {
    if (e.button === 3) { 
        navBackKeyClicked();
    }
}

function getViewStateName(viewState) {
    var name,
        viewStates = Windows.UI.ViewManagement.ApplicationViewState;
    if (viewState === viewStates.fullScreenLandscape) {
        name = "FullScreenLandscape";
    } else if (viewState === viewStates.filled) {
        name = "Filled";
    } else if (viewState === viewStates.snapped) {
        name = "Snapped";
    } else if (viewState === viewStates.fullScreenPortrait) {
        name = "FullScreenPortrait";
    } else {
        name = "Unknown";
    }
    return name;
}

function tryParse(json, skipNavToErrorPageOnFailure) {
    try {
        return JSON.parse(json);
    } catch (e) {
        if (_OM) {
            logMessage(LM.error, "tryParse: Failed to parse JSON: " + e.name + ": " + e.message + ", JSON string: " + json);
            if (!skipNavToErrorPageOnFailure) {
                _OM.nativeOM.navigateToErrorPage(_OM.nativeOM.loadStringResource(17)); 
            }
        }
    }
}


function postResult(result, args, msg) {
    args.returnValue = result;
    msg.source.postMessage(args, msg.origin);
    args.callbackId = null;
}

function showInBrowser(page, url) {
    var uriToShow = null;
    if (page === "termsofuse") {
        uriToShow = "http://go.microsoft.com/fwlink/p/?LinkId=298979";
        if (_OM && _OM.namespace && _OM.namespace.market) {
            var market = _OM.namespace.market.toLowerCase();
            switch (market) {
                case "tw":
                    uriToShow = "http://go.microsoft.com/fwlink/p/?LinkID=299078";
                    break;
                case "jp":
                    uriToShow = "http://go.microsoft.com/fwlink/p/?LinkID=299079";
                    break;
            }
        }
    } else if (page === "help") {
        uriToShow = "http://go.microsoft.com/fwlink/p/?LinkId=282462";
    } else if (page === "termsofuse_csv") {
        if (url) {
            uriToShow = url;
        } else {
            logMessage(LM.error, "showInBrowser: termsofuse_csv requires a url to show");
        }
    } else if (page === "other") {
        uriToShow = url;
    }

    if (uriToShow) {
        
        if (_OM && _OM.namespace && _OM.namespace.lcid && _OM.namespace.lcid !== "") {
            uriToShow += "&clcid=0x" + _OM.namespace.lcid;
        }

        var uri = new Windows.Foundation.Uri(uriToShow);
        var options = new Windows.System.LauncherOptions();
        options.desiredRemainingView = Windows.UI.ViewManagement.ViewSizePreference.useHalf;
        Windows.System.Launcher.launchUriAsync(uri, options).done(function (success) { });
    }
}

function OMStub() {
    this.nativeOM = null;
    this.initialized = false;

    this.frameUrl = function () {
        var url = null;
        if (_OM) {
            url = this.nativeOM.frameUrl.toLowerCase(); 
        }
        return url;
    };

    this.onIFrameLoaded = function () {
        
        try {
            var wui = Windows.UI.ApplicationSettings;
            var settingsPane = wui.SettingsPane.getForCurrentView();
            var that = this.nativeOM;
            settingsPane.addEventListener("commandsrequested", function (e) {
                try {
                    var n = Windows.UI.ApplicationSettings;
                    var vector = e.request.applicationCommands;
                    
                    var commandYourAccount = new n.SettingsCommand("yourAccountId", that.loadStringResource(50), function () { that.showSettingsPage("?display=preferences"); });
                    
                    var commandHelp = new n.SettingsCommand("helpId", that.loadStringResource(51), function () { showInBrowser("help"); });
                    
                    var commandToU = new n.SettingsCommand("termsOfUseId", that.loadStringResource(52), function () { showInBrowser("termsofuse"); });
                    
                    var commandAppPreferences = new n.SettingsCommand("appPreferencesId", that.loadStringResource(53), function () { that.showSettingsPage("?display=apppreferences"); });
                    
                    var commandAppUpdates = new n.SettingsCommand("appUpdatesId", that.loadStringResource(54), function () { that.showSettingsPage("?display=appupdates"); });

                    vector.append(commandYourAccount);
                    vector.append(commandAppPreferences);
                    vector.append(commandAppUpdates);
                    vector.append(commandToU);
                    vector.append(commandHelp);
                } catch (ex) {
                    logMessage(LM.error, "onIFrameLoaded: exception in commandsrequested handler = " + ex.name + ": " + ex.message);
                }
            }, false);
        } catch (ex) {
            logMessage(LM.error, "onIFrameLoaded: exception creating charms = " + ex.name + ": " + ex.message);
        }

        
        if (wsWindow) {
            var biObj = this.getBI();
            var args = {
                method: "systemSettingsChanged",
                animationsEnabled: animationsEnabled,
                bi: biObj
            };
            wsWindow.postMessage(args, wsOrigin);
        }

        sendUpdateCount();

        this.registerCallbacks();
    };

    this.registerCallbacks = function () {
        this._registerSharingCallback();
    };

    this.unregisterCallbacks = function () {
        this._unregisterSharingCallback();
    };

    this.getNamespace = function (args, msg) {
        return tryParse(this.nativeOM.namespace);
    };

    this.hubBackgroundDisabled = function (args, msg) {
        return this.nativeOM.isHubBackgroundDisabled;
    };

    this.showPicksForYou = function (args, msg) {
        return this.nativeOM.showPicksForYou;
    };

    this.getBI = function (args, msg) {
        return tryParse(this.nativeOM.bi);
    };

    this.getImageUrlRoot = function (args, msg) {
        return { imageUrlRoot: this.nativeOM.imageUrlRoot, maxHosts: this.nativeOM.maxImageHosts };
    };

    this.setSessionId = function (args, msg) {
        this.nativeOM.setSessionId(args.sessionId);
    };

    this.canGoBack = function (args, msg) {
        return this.nativeOM.canGoBack;
    };

    this.onAjaxPageLoadComplete = function (args, msg) {
        isNavInProgress = false;
        startPendingNavigation();
    };

    this.onAjaxPageUnloadComplete = function (args, msg) {
        var iframe = document.getElementById(args.idToHide);
        if (iframe) {
            
            if (args.idToHide !== args.idToShow) {
                document.body.removeChild(iframe);
                iframe = document.getElementById(args.idToShow);
                if (iframe) {
                    iframe.style.opacity = 1;
                }
            } else {
                
                iframe.style.display = "none";
            }
        }
    };

    
    this.getAppInfo = function (args, msg) {
        this.nativeOM.getAppInfo(args.appId,
                                 function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getAppInfoByRelease = function (args, msg) {
        this.nativeOM.getAppInfoByRelease(args.appId, args.releaseId,
                                          function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getInAppInfo = function (args, msg) {
        this.nativeOM.getInAppInfo(args.appId,
                                   function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getHomePageData = function (args, msg) {
        this.nativeOM.getHomePageData(function (result) { postResult(tryParse(result), args, msg); });
    };

    this.onSearchQueryChanged = function (args, msg) {
        this.nativeOM.onSearchQueryChanged(args.queryText, args.inputLanguage, args.requestId,
            function (result) {
                var jsonObject = tryParse(result, true);
                if (jsonObject) {
                    postResult(jsonObject, args, msg);
                }
            });
    };

    this.getSearchImage = function (args, msg) {
        this.nativeOM.getSearchImage(args.relativeImage, args.imageUrl, args.bkgd, args.largeImage, args.guid, args.index,
            function (sImageInfo) {
                var jsonObject = tryParse(sImageInfo, true);
                if (jsonObject) {
                    var imgPath = jsonObject.imgPath.replace("\\\\?\\", "");

                    if (imgPath !== "") {
                        
                        Windows.Storage.StorageFile.getFileFromPathAsync(imgPath).then(function (file) {
                            try {
                                return file.openAsync(Windows.Storage.FileAccessMode.read);
                            } catch (e) {
                                if (_OM) {
                                    logMessage(LM.error, "getSearchImage: Failed to file.openAsync. file name: " + imgPath);
                                }
                                return null;
                            }
                        }
                        ).then(function (fileStream) {
                            if (fileStream !== null && fileStream !== undefined) {
                                try {
                                    jsonObject.imgBits = MSApp.createBlobFromRandomAccessStream("image/png", fileStream);
                                } catch (e) {
                                    if (_OM) {
                                        logMessage(LM.error, "getSearchImage: Failed to createBlobFromRandomAccessStream. file name: " + imgPath);
                                    }
                                }
                            }
                        })
                        .done(function () {
                            postResult(jsonObject, args, msg);
                        });
                    }
                }
            });
    };

    this.onResultSuggestionChosen = function (args, msg) {
        this.nativeOM.onResultSuggestionChosen(args.appID);
    };

    this.onSearchQuerySubmitted = function (args, msg) {
        this.nativeOM.onSearchQuerySubmitted(args.queryText, args.inputLanguage);
    };

    this.getFeaturedAppList = function (args, msg) {
        this.nativeOM.getFeaturedAppList(args.listId,
                                         function (result) { postResult(tryParse(result), args, msg); });
    };

    
    this.getAppList = function (args, msg) {
        this.nativeOM.getAppList(args.controlType, args.listId, args.queryString, args.pageIndex,
                                 function (result) { postResult(tryParse(result), args, msg); });
    };

    
    this.getDataGeneratedLists = function (args, msg) {
        this.nativeOM.getDataGeneratedLists(args.listId, args.categoryId, args.maxApps,
                                            function (result) { postResult(tryParse(result), args, msg); });
    };

    
    this.getPicksForYou = function (args, msg) {
        this.nativeOM.getPicksForYou(args.categoryId, args.maxApps,
                                     function (result) { postResult(tryParse(result), args, msg); });
    };

    
    this.getCategoryList = function (args, msg) {
        
        var sortBy = 3,
            sortOrder = 2,
            ns = this.getNamespace();
        for (var i = 0; i < ns.browseSortOptions.length; i++) {
            if (ns.browseSortOptions[i].id === ns.browseSortDefault) {
                sortBy = ns.browseSortOptions[i].sortBy;
                sortOrder = ns.browseSortOptions[i].sortOrder;
                break;
            }
        }
        this.nativeOM.getCategoryList(args.categoryId, ns.priceDefault, sortBy, sortOrder, args.maxApps,
                                      function (result) { postResult(tryParse(result), args, msg); });
    };

    
    this.getSimilarApps = function (args, msg) {
        this.nativeOM.getSimilarApps(args.appId, args.maxApps,
                                     function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getAppsByDeveloper = function (args, msg) {
        this.nativeOM.getAppsByDeveloper(args.developerName, args.maxApps, function (result) { postResult(tryParse(result), args, msg); });
    };

    
    this.getTopicList = function (args, msg) {
        this.nativeOM.getTopicList(args.topicId, args.maxApps,
                                   function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getAppReviewList = function (args, msg) {
        this.nativeOM.getAppReviewList(args.appId, args.releaseId, args.ratingFilter, args.versionFilter, args.sortOrder, args.startIndex, args.cReviews,
                                       function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getSettings = function (args, msg) {
        this.nativeOM.getSettings(function (result) { postResult(tryParse(result), args, msg); });
    };

    this.saveSettings = function (args, msg) {
        this.nativeOM.saveSettings(args.settings,
                                   function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getUserReview = function (args, msg) {
        this.nativeOM.getUserReview(args.appId,
                                    function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getRatings = function (args, msg) {
        this.nativeOM.getRatings(args.appId, args.releaseId,
                                 function (result) { postResult(tryParse(result), args, msg); });
    };

    this.goBack = function (args, msg) {
        this.nativeOM.goBack();
    };

    this.showHomePage = function (args, msg) {
        this.nativeOM.showHomePage();
    };

    this.showSettingsPage = function (args, msg) {
        if (args.page.toLowerCase() === "termsofuse") {
            showInBrowser("termsofuse");
        } else if (args.page.toLowerCase() === "help") {
            showInBrowser("help");
        } else if (args.page.toLowerCase() === "termsofuse_csv") {
            showInBrowser("termsofuse_csv", args.url);
        } else {
            this.nativeOM.showSettingsPage("?display=" + args.page);
        }
    };

    this.showReacquirePage = function (args, msg) {
        this.nativeOM.showReacquirePage();
    };

    this.showUpdatesPage = function (args, msg) {
        this.nativeOM.showUpdatesPage(args.rescan);
    };

    this.showInstallsPage = function (args, msg) {
        this.nativeOM.showInstallsPage(args.writeTravelLog);
    };

    this.navigateToErrorPage = function (args, msg) {
        this.nativeOM.navigateToErrorPage(args.message);
    };

    this.showResultsView = function (args, msg) {
        this.nativeOM.showResultsView(args.params);
    };

    this.showCategoryHub = function (args, msg) {
        this.nativeOM.showCategoryHub(args.params);
    };

    this.showTopicPage = function (args, msg) {
        this.nativeOM.showTopicPage(args.params);
    };

    this.showPDP = function (args, msg) {
        this.nativeOM.showPDP(args.appId);
    };

    this.showReviewPage = function (args, msg) {
        this.nativeOM.showReviewPage(args.appId);
    };

    this.showReviewListPage = function (args, msg) {
        this.nativeOM.showReviewListPage(args.appId);
    };

    this.showReportProblemPage = function (args, msg) {
        this.nativeOM.showReportProblemPage(args.url);
    };

    this.setHelpfulnessVote = function (args, msg) {
        this.nativeOM.setHelpfulnessVote(args.appId, args.reviewId, args.helpful,
                                         function (result) { postResult(tryParse(result), args, msg); });
    };

    this.submitRating = function (args, msg) {
        this.nativeOM.submitRating(args.appId, args.packageFamilyName, args.title, args.comment, args.rating, args.version, args.osVersion, args.trial);
    };

    this.submitReview = function (args, msg) {
        this.nativeOM.submitReview(args.appId, args.packageFamilyName, args.title, args.comment, args.rating, args.version, args.osVersion, args.trial,
                                   function (result) { postResult(tryParse(result), args, msg); });
    };

    this.submitAppProblem = function (args, msg) {
        this.nativeOM.submitAppProblem(args.appId, args.category, args.details,
                                       function (result) { postResult(tryParse(result), args, msg); });
    };

    this.submitReviewProblem = function (args, msg) {
        this.nativeOM.submitReviewProblem(args.appId, args.reviewId, args.category, args.details,
                                          function (result) { postResult(tryParse(result), args, msg); });
    };

    this.redeemToken = function(args, msg) {
        this.nativeOM.redeemToken(args.tokenId, args.appId, args.appName, args.inAppOfferToken, args.updateId, args.appLanguage, args.appPrice);
    };

    this.redeemStoredValueToken = function (args, msg) {
        this.nativeOM.redeemStoredValueToken(args.csvToken,
            function (result) {
                if (wsWindow) {
                    var returnArgs = {
                        method: "redeemStoredValueTokenResponse",
                        redeemResponse: tryParse(result),
                    };
                    wsWindow.postMessage(returnArgs, wsOrigin);
                }
            });
    };

    this.startPIAttach = function (args, msg) {
        this.nativeOM.startPIAttach(
            function (result) { postResult(tryParse(result), args, msg); });
    };

    this.continuePIAttachFromPCS = function (args, msg) {
        this.nativeOM.continuePIAttachFromPCS(args.accountId, args.piid,
            function (result) { postResult(tryParse(result), args, msg); });
    };

    this.lookupToken = function (args, msg) {
        this.nativeOM.lookupToken(args.token,
            function (result) { postResult(tryParse(result), args, msg); });
    };

    this.purchase = function (args, msg) {
        this.nativeOM.purchase(args.appId, args.appName, args.updateId, args.appLanguage, args.appPrice, args.type, args.remediation);
    };

    this.resumePurchase = function (args, msg) {
        this.nativeOM.resumePurchase(args.appId, args.appName, args.updateId, args.appLanguage, args.appPrice, args.type, args.response3ds);
    };

    this.resumeAsyncPurchase = function (args, msg) {
        this.nativeOM.resumeAsyncPurchase(args.appId, args.appName, args.updateId, args.appLanguage, args.appPrice, args.transactionId, args.pfn);
    };

    this.getActiveInstalls = function (args, msg) {
        return tryParse(this.nativeOM.activeInstalls);
    };

    this.getActiveInstallSummary = function (args, msg) {
        return tryParse(this.nativeOM.activeInstallSummary);
    };

    this.getMachineList = function (args, msg) {
        this.nativeOM.getMachineList(function (result) { postResult(tryParse(result), args, msg); });
    };

    this.removeMachine = function (args, msg) {
        this.nativeOM.removeMachine(args.machineId, function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getYourAppsList = function (args, msg) {
        this.nativeOM.getYourAppsList(args.machineId, args.sortBy,
                                          function (result) { postResult(tryParse(result), args, msg); });
    };

    this.syncLicenses = function (args, msg) {
        this.nativeOM.syncLicenses(args.bSyncAll, function (result) { postResult(tryParse(result), args, msg); });
    };

    this.syncAppLicense = function (args, msg) {
        this.nativeOM.syncAppLicense(args.appId, function (result) { postResult(tryParse(result), args, msg); });
    };

    this.installApps = function (args, msg) {
        this.nativeOM.installApps(args.ItemIds, args.topicId, args.isUpdates);
    };

    this.refreshLicensedAppList = function (args, msg) {
        this.nativeOM.refreshLicensedApps();
    };

    this.getUpdatesList = function (args, msg) {
        this.nativeOM.getUpdatesList(args.rescan, function (result) { postResult(tryParse(result), args, msg); });
    };

    this.retryInstallation = function (args, msg) {
        this.nativeOM.retryInstallation(args.appId);
    };

    this.cancelInstallation = function (args, msg) {
        this.nativeOM.cancelInstallation(args.appId);
    };

    this.pauseInstallation = function (args, msg) {
        this.nativeOM.pauseInstallation(args.appId);
    };

    this.resumeInstallation = function (args, msg) {
        this.nativeOM.resumeInstallation(args.appId);
    };

    this.logMessage = function (args, msg) {
        logConsole(args.type, args.message);
        this.nativeOM.logMessage(args.type, args.message);
    };

    this.etwListInit = function (args, msg) {
        this.nativeOM.etwListInit(args.start, args.interactive, args.listType, args.listId, args.categoryId, args.appCount);
    };

    this.etwResultsListRestored = function (args, msg) {
        this.nativeOM.etwResultsListRestored();
    };

    this.etwHomeListRestored = function (args, msg) {
        this.nativeOM.etwHomeListRestored();
    };

    this.etwTileClicked = function (args, msg) {
        this.nativeOM.etwTileClicked(args.tileType, args.id);
    };

    this.etwGroupTitleClicked = function (args, msg) {
        this.nativeOM.etwGroupTitleClicked(args.categoryId);
    };

    this.etwFilterSortSelected = function (args, msg) {
        this.nativeOM.etwFilterSortSelected(args.controlId, args.optionText, args.optionVal);
    };

    this.etwPDPOpenStart = function (args, msg) {
        this.nativeOM.etwPDPOpenStart(args.appId);
    };

    this.etwPDPAcquisitionInitiationStart = function (args, msg) {
        this.nativeOM.etwPDPAcquisitionInitiationStart(args.appId, args.action, args.appType, args.appVersion);
    };

    this.etwPDPAcquisitionProgressStart = function (args, msg) {
        this.nativeOM.etwPDPAcquisitionProgressStart(args.appId, args.action, args.appType, args.appVersion);
    };

    this.etwPDPOpenStop = function (args, msg) {
        this.nativeOM.etwPDPOpenStop();
    };

    this.etwPDPAcquisitionInitiationStop = function (args, msg) {
        this.nativeOM.etwPDPAcquisitionInitiationStop();
    };

    this.etwPDPMetadataStop = function (args, msg) {
        this.nativeOM.etwPDPMetadataStop();
    };

    this.etwUpdateListInit = function (args, msg) {
        this.nativeOM.etwUpdateListInit();
    };

    this.etwReacquireListInit = function (args, msg) {
        this.nativeOM.etwReacquireListInit(args.cItems);
    };

    this.etwSettingsPageLoadComplete = function (args, msg) {
        this.nativeOM.etwSettingsPageLoadComplete();
    };

    this.etwPDPLicenseInstallStop = function (args, msg) {
        this.nativeOM.etwPDPLicenseInstallStop();
    };

    this.etwPDPTabClicked = function (args, msg) {
        this.nativeOM.etwPDPTabClicked(args.appId, args.tab);
    };

    this.etwPDPScreenShot = function (args, msg) {
        this.nativeOM.etwPDPScreenShot(args.appId, args.screenshot);
    };

    this.etwRrrDisplaySubmitReviewPage = function (args, msg) {
        this.nativeOM.etwRrrDisplaySubmitReviewPage(args.start, args.appId, args.context);
    };

    this.etwRrrDisplaySubmitAppProblemPage = function (args, msg) {
        this.nativeOM.etwRrrDisplaySubmitAppProblemPage(args.start, args.appId, args.context);
    };

    this.etwRrrSubmitHelpfulnessVote = function (args, msg) {
        this.nativeOM.etwRrrSubmitHelpfulnessVote(args.start, args.appId, args.context);
    };

    this.etwRrrSubmitReportReview = function (args, msg) {
        this.nativeOM.etwRrrSubmitReportReview(args.start, args.appId, args.context);
    };

    this.etwRrrSubmitReview = function (args, msg) {
        this.nativeOM.etwRrrSubmitReview(args.start, args.appId, args.context);
    };

    this.etwRrrSubmitAppProblem = function (args, msg) {
        this.nativeOM.etwRrrSubmitAppProblem(args.start, args.appId, args.context);
    };

    this.etwRrrReviewListSort = function (args, msg) {
        this.nativeOM.etwRrrReviewListSort(args.start, args.appId, args.context);
    };

    this.etwRrrReviewListLoadPage = function (args, msg) {
        this.nativeOM.etwRrrReviewListLoadPage(args.start, args.appId, args.context);
    };

    this.etwRrrReviewTabClick = function (args, msg) {
        this.nativeOM.etwRrrReviewTabClick(args.start, args.appId, args.context);
    };

    this.etwPCSFrameOpen = function (args, msg) {
        this.nativeOM.etwPCSFrameOpen(args.fStart);
    };

    this.etwEvent = function(args, msg) {
        this.nativeOM.etwScriptEvent(args.fStart, args.str);
    };

    this.etwPageLoaded = function(args, msg) {
        this.nativeOM.etwPageLoaded(args.str);
    };

    this.sendBingLoggingRequest = function(args, msg) {
        this.nativeOM.sendBingLoggingRequest(args.headers, args.body);
    };

    this.setMuid = function (args, msg) {
        this.nativeOM.setMuid(args.muid);
    };

    this.authenticateUser = function (args, msg) {
        this.nativeOM.authenticateUser(args.authType, function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getStoreAccountDetails = function (args, msg) {
        this.nativeOM.getStoreAccountDetails(function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getConnectedAccountDetails = function (args, msg) {
        this.nativeOM.getConnectedAccountDetails(function (result) { postResult(tryParse(result), args, msg); });
    };

    this.signout = function (args, msg) {
        this.nativeOM.signout();
    };

    this.getPCSDetails = function (args, msg) {
        this.nativeOM.getPCSDetails(function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getAVVendorName = function (args, msg) {
        return this.nativeOM.avVendorName;
    };

    this.setupPaymentAccount = function(args, msg) {
        this.nativeOM.setupPaymentAccount(args.accountid, args.piid, args.biSource,
                                          function (result) { postResult(tryParse(result), args, msg); });
    };

    this.getPaymentSettings = function(args, msg) {
        this.nativeOM.getPaymentSettings(function (result) { postResult(tryParse(result), args, msg); });
    };

    this.showPurchasePDP = function (args, msg) {
        this.nativeOM.showPurchasePDP(args.purchaseQuery);
    };

    this.showPCS = function (args, msg) {
        this.nativeOM.showPCS(args.strPiContextParam);
    };

    this.updateTravelLogCurrentPageParams = function (args, msg) {
        this.nativeOM.updateTravelLogCurrentPageParams(decodeURIComponent(args.params));
    };

    this.updateTravelLogPreviousPageParams = function (args, msg) {
        this.nativeOM.updateTravelLogPreviousPageParams(decodeURIComponent(args.params));
    };

    this.updateTravelLogCurrentPageData = function (args, msg) {
        this.nativeOM.updateTravelLogCurrentPageData(args.url, args.pageData)
    };

    this.getTravelLogCurrentPageData = function (args, msg) {
        return tryParse(this.nativeOM.travelLogCurrentPageData);
    };

    this.removeCurrentPageFromTravelLog = function (args, msg) {
        this.nativeOM.removeCurrentPageFromTravelLog();
    };

    this.suspendDefferal = null;
    this.suspendComplete = function (args, msg) {
        if (_OM.suspendDefferal) {
            _OM.suspendDefferal.complete();
            _OM.suspendDefferal = null;
        }
    };

    this.invalidateCachedUserReview = function (args, msg) {
        this.nativeOM.invalidateCachedUserReview(args.appId);
    };

    this.clearAuthenticatedAppId = function(args, msg) {
        this.nativeOM.clearAuthenticatedAppId();
    };

    this.showMessageDialog = function (args, msg) {

        cancelModalDialogs();

        var onMsgButtonClicked = function (cmdId) {
            messageDialogAsyncOperation = null;
            postResult(cmdId, args, msg);
        }

        var onError = function (value) {
            if (value.name === "Canceled" && args.cancelCommandIndex !== -1) {
                onMsgButtonClicked(args.buttons[args.cancelCommandIndex].id);
            }
        }

        var messageBox = new Windows.UI.Popups.MessageDialog(args.message, args.title);

        for (var i = 0; i < args.buttons.length; i++) {
            var ucommand = new Windows.UI.Popups.UICommand(args.buttons[i].text, function (command) {
                onMsgButtonClicked(command.id);
            }, args.buttons[i].id);
            messageBox.commands.append(ucommand);
        }

        
        if (args.cancelCommandIndex !== -1) {
            messageBox.cancelCommandIndex = args.cancelCommandIndex;
        }

        messageDialogAsyncOperation = messageBox.showAsync();

        messageDialogAsyncOperation.done(null, onError);
    };

    this.launchPcsFlow = function (args, msg) {
        var pcsUri = new Windows.Foundation.Uri(args.pcsUrl);
        Windows.System.Launcher.launchUriAsync(pcsUri).done();
    };

    this.hideSplashScreen = function (args, msg) {
        hideSplashScreen(false);
    };

    this.hideFrameForDemo = function (args, msg) {
        hideFrameForDemo();
    }

    this.isUserLoggedIn = function (args, msg) {
        return this.nativeOM.isUserLoggedIn;
    };

    this.getUserCID = function (args, msg) {
        return this.nativeOM.userCID;
    };

    this.getLoggingLevel = function (args, msg) {
        return this.nativeOM.loggingLevel;
    };

    this.logUserClickAction = function (args, msg) {
        this.nativeOM.logUserClickAction(args.controlId, args.parentPath, args.appId);
    }

    this.showOSUpgradePage = function (args, msg) {
        this.nativeOM.showOSUpgradePage(args.referrer);
    };

    this.getOSUpgradeInfo = function (args, msg) {
        this.nativeOM.getOSUpgradeInfo(function (result) { postResult(tryParse(result), args, msg); });
    };

    this.onUpgradeInstallUserActionClick = function (args, msg) {
        this.nativeOM.onUpgradeInstallUserActionClick(args.hwnd, args.uMsg);
    };

    this.isOSUpgradeRebootPending = function (args, msg) {
        return this.nativeOM.isOSUpgradeRebootPending;
    };

    this.submitTuningRecs = function (args, msg) {
        this.nativeOM.submitTuningRecs(args.entityIds, args.impressionGuid);
    };

    this.formatNumber = function (args, msg) {
        return this.nativeOM.formatNumber(args.number);
    };

    this.qosScenarioFailWithInit = function (args, msg) {
        this.nativeOM.qosScenarioFailWithInit(args.qsid, args.hrError, args.failedApi);
    };

    this.showInWebBrowser = function (args, msg) {
        showInBrowser("other", args.url);
    };

    this.onEdgy = function (state) {
        if (wsWindow) {
            var args = {
                method: "onEdgy",
                state: state
            };
            wsWindow.postMessage(args, wsOrigin);
        }
    };

    

    this._sharingRequest = null;
    this._sharingDeferral = null;

    this.setSharingData = function (args, msg) {

        var sharingData = args.sharingData;
        var request = this._sharingRequest;
        var deferral = this._sharingDeferral;

        if (request && deferral) {
            this._sharingRequest = null;
            this._sharingDeferral = null;
            if (sharingData) {
                if (sharingData.error) {
                    request.failWithDisplayText(sharingData.error);
                } else {
                    var data = request.data;
                    var properties = data.properties;
                    if (sharingData.title) {
                        properties.title = sharingData.title;
                    }
                    if (sharingData.description) {
                        properties.description = sharingData.description;
                    }
                    if (sharingData.thumbnailUrl) {
                        var link = new Windows.Foundation.Uri(sharingData.thumbnailUrl);
                        properties.thumbnail = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(link);
                    }
                    if (sharingData.text) {
                        data.setText(sharingData.text);
                    }
                    if (sharingData.link) {
                        var link = new Windows.Foundation.Uri(sharingData.link);
                        data.setUri(link);
                    }
                    if (sharingData.html) {
                        var htmlFormat = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.createHtmlFormat(sharingData.html);
                        data.setHtmlFormat(htmlFormat);
                    }
                }
            }
            deferral.complete();
        }
    };

    this.sharingEventHandler = function (e) {
        
        if (_OM._sharingDeferral) {
            _OM._sharingDeferral.complete();
        }

        _OM._sharingRequest = e.request;
        _OM._sharingDeferral = _OM._sharingRequest.getDeferral();

        
        if (wsWindow) {
            var args = { method: "sharingEvent" };
            wsWindow.postMessage(args, wsOrigin);
        }
    };

    
    this._registerSharingCallback = function () {
        
        var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
        dataTransferManager.addEventListener("datarequested", this.sharingEventHandler);
    };

    this._unregisterSharingCallback = function () {
        try {
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.removeEventListener("datarequested", this.sharingEventHandler);
        } catch (ex) {
            
        }

        if (this._sharingRequest) {
            this._sharingRequest = null;
        }

        if (this._sharingDeferral) {
            this._sharingDeferral.complete();
            this._sharingDeferral = null;
        }
    };

    this.unhandledException = function (args, msg) {
        unhandledException(args.errMsg, args.errUrl, args.errLine);
    };

    
    this.nativeOM = new WinStore.UI.OM(HandleMessageFromNative);
}