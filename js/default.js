(function () {
    "use strict";

    var path = window.location.pathname;
    var pageFile = path.split("/").pop() || "default.html";
    var currentPage = pageFile.replace(".", "_");

    var topBarTranslations = {
        "en": { "home": "Home", "charts": "Top charts", "categories": "Categories", "allApps": "All Apps", "account": "Account", "search": "Search for apps", "logout": "Logout", "quickAccessHeader": "I want to...", "openHome": "Open Home", "openCharts": "Open Top charts", "openCategories": "Open Categories", "openAllApps": "Open All Apps", "selectMusic": "Select Music", "shuffle": "Shuffle", "repeat": "Repeat", "notesPlaceholder": "Write notes here...", "notes": "Notes" },
        "de": { "home": "Startseite", "charts": "Top-Charts", "categories": "Kategorien", "allApps": "Alle Apps", "account": "Konto", "search": "Nach Apps suchen", "logout": "Abmelden", "quickAccessHeader": "Ich möchte...", "openHome": "Startseite öffnen", "openCharts": "Top-Charts öffnen", "openCategories": "Kategorien öffnen", "openAllApps": "Alle Apps öffnen", "selectMusic": "Musik auswählen", "shuffle": "Zufällig", "repeat": "Wiederholen", "notesPlaceholder": "Notizen hier schreiben...", "notes": "Notizen" },
        "fr": { "home": "Accueil", "charts": "Palmarès", "categories": "Catégories", "allApps": "Toutes les applications", "account": "Compte", "search": "Rechercher des applications", "logout": "Déconnexion", "quickAccessHeader": "Je veux...", "openHome": "Ouvrir Accueil", "openCharts": "Ouvrir Palmarès", "openCategories": "Ouvrir Catégories", "openAllApps": "Ouvrir Toutes les applications", "selectMusic": "Sélectionner la musique", "shuffle": "Aléatoire", "repeat": "Répéter", "notesPlaceholder": "Écrire des notes ici...", "notes": "Notes" },
        "es": { "home": "Inicio", "charts": "Principales", "categories": "Categorías", "allApps": "Todas las aplicaciones", "account": "Cuenta", "search": "Buscar aplicaciones", "logout": "Cerrar sesión", "quickAccessHeader": "Quiero...", "openHome": "Abrir Inicio", "openCharts": "Abrir Principales", "openCategories": "Abrir Categorías", "openAllApps": "Abrir Todas las aplicaciones", "selectMusic": "Seleccionar música", "shuffle": "Aleatorio", "repeat": "Repetir", "notesPlaceholder": "Escribe notas aquí...", "notes": "Notas" },
        "tr": { "home": "Giriş", "charts": "En popüler", "categories": "Kategoriler", "allApps": "Tüm Uygulamalar", "account": "Hesap", "search": "Uygulama ara", "logout": "Çıkış Yap", "quickAccessHeader": "İstiyorum...", "openHome": "Giriş'i aç", "openCharts": "En popülerleri aç", "openCategories": "Kategorileri aç", "openAllApps": "Tüm Uygulamaları aç", "selectMusic": "Müzik seç", "shuffle": "Karışık", "repeat": "Tekrarla", "notesPlaceholder": "Notları buraya yazın...", "notes": "Notlar" },
        "ru": { "home": "Главная", "charts": "Топ-чарты", "categories": "Категории", "allApps": "Все приложения", "account": "Аккаунт", "search": "Поиск приложений", "logout": "Выйти", "quickAccessHeader": "Я хочу...", "openHome": "Открыть Главную", "openCharts": "Открыть Топ-charts", "openCategories": "Открыть Категории", "openAllApps": "Открыть Все приложения", "selectMusic": "Выбрать музыку", "shuffle": "В случайном порядке", "repeat": "Повторять", "notesPlaceholder": "Пишите заметки здесь...", "notes": "Заметки" },
        "pl": { "home": "Start", "charts": "Najlepsze", "categories": "Kategorie", "allApps": "Wszystkie aplikacje", "account": "Konto", "search": "Szukaj aplikacji", "logout": "Wyloguj", "quickAccessHeader": "Chcę...", "openHome": "Otwórz Start", "openCharts": "Otwórz Najlepsze", "openCategories": "Otwórz Kategorie", "openAllApps": "Otwórz Wszystkie aplikacje", "selectMusic": "Wybierz muzykę", "shuffle": "Losowo", "repeat": "Powtarzaj", "notesPlaceholder": "Wpisz notatki tutaj...", "notes": "Notatki" },
        "ro": { "home": "Acasă", "charts": "Topuri", "categories": "Categorii", "allApps": "Toate aplicațiile", "account": "Cont", "search": "Caută aplicații", "logout": "Deconectare", "quickAccessHeader": "Vreau să...", "openHome": "Deschide Acasă", "openCharts": "Deschide Topuri", "openCategories": "Deschide Categorii", "openAllApps": "Deschide Toate aplicațiile", "selectMusic": "Selectează muzică", "shuffle": "Aleatoriu", "repeat": "Repetă", "notesPlaceholder": "Scrie note aici...", "notes": "Note" }
    };

    var selectedLangCode = localStorage.getItem("ws_language") || "en";
    var currentT = topBarTranslations[selectedLangCode] || topBarTranslations["en"];

    WinJS.Application.onactivated = function (args) {
        if (args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            var launchArgs = args.detail.arguments;
            if (launchArgs && launchArgs.indexOf("openfile=") === 0) {
                var fileName = launchArgs.substring("openfile=".length);
                openFileFromLocalFolder(fileName);
            }
        }
        args.setPromise(WinJS.UI.processAll().then(function () {
            renderTopBar();
            renderSidebar();
        }));
    };

    function loadTranslations() {
        var selectedLangCode = localStorage.getItem("ws_language") || "en";
        if (selectedLangCode === "en") return;

        var xhr = new XMLHttpRequest();
        xhr.open("GET", "language.xml", true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var xml = xhr.responseXML;
                if (!xml) {
                    console.warn("");
                    return;
                }

                var langNode = xml.querySelector("language[id='" + selectedLangCode + "']");
                if (langNode) {
                    var pageNode = langNode.querySelector(currentPage);

                    if (pageNode && pageNode.children) {
                        var translations = pageNode.children;
                        for (var i = 0; i < translations.length; i++) {
                            var id = translations[i].tagName;
                            var text = translations[i].textContent;
                            var element = document.getElementById(id);

                            if (element) {
                                if (element.tagName === "INPUT") {
                                    element.placeholder = text;
                                } else {
                                    element.innerText = text;
                                }
                            }
                        }
                    } else {
                        console.warn("Sektion '" + currentPage + "'");
                    }
                }
            }
        };
    }

    function applySavedTheme() {
        var activeTheme = JSON.parse(localStorage.getItem("ws_active_theme"));
        if (activeTheme && document.body) {
            document.body.style.backgroundColor = activeTheme.bg;
            document.body.style.color = activeTheme.text;
            document.body.style.fontFamily = activeTheme.font;

            var l = activeTheme.layout;
            if (l) {
                var styleTag = document.getElementById("dynamic-theme-css");
                if (!styleTag) {
                    styleTag = document.createElement("style");
                    styleTag.id = "dynamic-theme-css";
                    document.head.appendChild(styleTag);
                }
                var bgImageRule = activeTheme.img ? "background-image: url('" + activeTheme.img + "') !important;" : "background-image: none !important;";
                var topbarColor = activeTheme.topbar || "#008000";
                var topbarTextColor = activeTheme.topbarText || "#ffffff";
                var searchBarColor = activeTheme.searchBar || "#ffffff";
                var searchIconColor = activeTheme.searchIcon || "#228b22";
                var css = "body { " +
                          "background-color: " + activeTheme.bg + " !important; " +
                          bgImageRule +
                          "color: " + activeTheme.text + " !important; " +
                          "font-family: " + activeTheme.font + " !important; " +
                          (l.fontSize ? "font-size: " + l.fontSize + "px !important; " : "") +
                          "} " +
                          ".topBar { background-color: " + topbarColor + " !important; background: " + topbarColor + " !important; }" +
                          ".topBar .nav-link { color: " + topbarTextColor + " !important; }" +
                          ".topBar .logo-home-container { color: " + topbarTextColor + " !important; }" +
                          ".topBar .logo-home-container li { color: " + topbarTextColor + " !important; }" +
                          ".topBar .search-container { background-color: " + searchBarColor + " !important; border-color: " + searchBarColor + " !important; border-radius: 15px !important; }" +
                          "#searchBar { color: #333 !important; border-radius: 15px !important; }" +
                          "#searchBar:-ms-input-placeholder { color: #666 !important; }" +
                          ".search-icon { color: " + searchIconColor + " !important; }" +
                          (l.pageTitleSize ? ".page-title { font-size: " + l.pageTitleSize + "px !important; }" : "") +
                          (l.sectionTitleSize ? ".section-title { font-size: " + l.sectionTitleSize + "px !important; " + (l.sectionTitleMarginTop ? "margin-top: " + l.sectionTitleMarginTop + "px !important; " : "") + "}" : "") +
                          (l.headerMarginTop ? ".header-area { margin-top: " + l.headerMarginTop + "px !important; " + (l.headerMarginLeft ? "margin-left: " + l.headerMarginLeft + "px !important; " : "") + "}" : "") +
                          (l.contentMarginLeft ? ".content-area { margin-left: " + l.contentMarginLeft + "px !important; " + (l.contentMaxWidth ? "max-width: " + l.contentMaxWidth + "px !important; " : "") + "}" : "") +
                          (l.themeCardPadding ? ".theme-card { padding: " + l.themeCardPadding + "px !important; }" : "") +
                          (l.themeInfoFontSize ? ".theme-info { font-size: " + l.themeInfoFontSize + "px !important; }" : "") +
                          (l.buttonPadding ? ".store-button { padding: " + l.buttonPadding + " !important; " + (l.buttonFontSize ? "font-size: " + l.buttonFontSize + "px !important; " : "") + "}" : "") +
                          (l.inputWidth ? ".input-group input[type='text'], .input-group select { width: " + l.inputWidth + "px !important; }" : "") +
                          (l.colorPreviewSize ? ".color-preview { width: " + l.colorPreviewSize + "px !important; height: " + l.colorPreviewSize + "px !important; }" : "") +
                          (l.topBarHeight ? ".topBar { height: " + l.topBarHeight + "px !important; }" : "") +
                          (l.topBarFontSize ? ".topBar .nav-link { font-size: " + l.topBarFontSize + "px !important; } .topBar .logo-home-container li:last-child { font-size: " + l.topBarFontSize + "px !important; }" : "") +
                          (l.navSlotWidth ? ".topBar .nav-slot { width: " + l.navSlotWidth + "ch !important; }" : "") +
                          (l.logoWidth ? ".topBar .logo-home-container img { width: " + l.logoWidth + "px !important; }" : "") +
                          (l.searchBarWidth ? ".topBar .search-container { width: " + l.searchBarWidth + "px !important; }" : "");
                MSApp.execUnsafeLocalFunction(function () {
                    styleTag.innerHTML = css;
                });
            } else {

                var topbarColor = activeTheme.topbar || "#008000";
                var topbarTextColor = activeTheme.topbarText || "#ffffff";
                var searchBarColor = activeTheme.searchBar || "#ffffff";
                var searchIconColor = activeTheme.searchIcon || "#228b22";
                var styleTag = document.getElementById("dynamic-theme-css");
                if (!styleTag) {
                    styleTag = document.createElement("style");
                    styleTag.id = "dynamic-theme-css";
                    document.head.appendChild(styleTag);
                }
                var bgImageRule = activeTheme.img ? "background-image: url('" + activeTheme.img + "') !important;" : "background-image: none !important;";
                var css = "body { background-color: " + activeTheme.bg + " !important; " + bgImageRule + "color: " + activeTheme.text + " !important; font-family: " + activeTheme.font + " !important; } " +
                          ".topBar { background-color: " + topbarColor + " !important; background: " + topbarColor + " !important; }" +
                          ".topBar .nav-link { color: " + topbarTextColor + " !important; }" +
                          ".topBar .logo-home-container { color: " + topbarTextColor + " !important; }" +
                          ".topBar .logo-home-container li { color: " + topbarTextColor + " !important; }" +
                          ".topBar .search-container { background-color: " + searchBarColor + " !important; border-color: " + searchBarColor + " !important; border-radius: 15px !important; }" +
                          "#searchBar { color: #333 !important; border-radius: 15px !important; }" +
                          "#searchBar:-ms-input-placeholder { color: #666 !important; }" +
                          ".search-icon { color: " + searchIconColor + " !important; }";
                MSApp.execUnsafeLocalFunction(function () {
                    styleTag.innerHTML = css;
                });
            }


            if (activeTheme.hideTopbar) {
                _scheduleTopBarHide();
            }
        }
    }

    function _scheduleTopBarHide() {

        var attempts = 0;
        var interval = setInterval(function () {
            var container = document.getElementById("topBarContainer");
            if (container && container.querySelector("ul")) {
                clearInterval(interval);
                _hideTopBarAnimated(container);
            }
            attempts++;
            if (attempts > 40) clearInterval(interval);
        }, 50);
    }

    function _hideTopBarAnimated(container) {
        if (!container) container = document.getElementById("topBarContainer");
        if (!container) return;
        var ul = container.querySelector("ul");
        if (!ul) return;
        var styleTag = document.getElementById("dynamic-theme-css") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "dynamic-theme-css" }));

        MSApp.execUnsafeLocalFunction(function () {
            var existing = styleTag.innerHTML;
            if (existing.indexOf("topBarSlideUp") === -1) {
                styleTag.innerHTML = existing +
                    "@-ms-keyframes topBarSlideUp { 0% { opacity:1; -ms-transform:translateY(0); } 100% { opacity:0; -ms-transform:translateY(-100%); } }" +
                    "@keyframes topBarSlideUp { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-100%); } }" +
                    "@-ms-keyframes topBarSlideDown { 0% { opacity:0; -ms-transform:translateY(-100%); } 100% { opacity:1; -ms-transform:translateY(0); } }" +
                    "@keyframes topBarSlideDown { 0% { opacity:0; transform:translateY(-100%); } 100% { opacity:1; transform:translateY(0); } }";
            }
        });
        ul.style.cssText += "; -ms-animation: topBarSlideUp 0.35s cubic-bezier(0.1,0.9,0.2,1) forwards; animation: topBarSlideUp 0.35s cubic-bezier(0.1,0.9,0.2,1) forwards;";
        setTimeout(function () {
            container.style.display = "none";
            container.setAttribute("data-topbar-hidden", "1");
        }, 360);
    }

    function _showTopBarAnimated() {
        var container = document.getElementById("topBarContainer");
        if (!container) return;
        container.style.display = "";
        container.removeAttribute("data-topbar-hidden");
        var ul = container.querySelector("ul");
        if (!ul) return;
        ul.style.opacity = "0";
        setTimeout(function () {
            ul.style.cssText += "; -ms-animation: topBarSlideDown 0.35s cubic-bezier(0.1,0.9,0.2,1) forwards; animation: topBarSlideDown 0.35s cubic-bezier(0.1,0.9,0.2,1) forwards;";
        }, 10);
    }

    document.addEventListener("contextmenu", function (e) {
        var container = document.getElementById("topBarContainer");
        if (!container) return;
        var saved = localStorage.getItem("ws_active_theme");
        var parsedSaved = null;
        if (saved) { try { parsedSaved = JSON.parse(saved); } catch (ex) { } }
        if (!parsedSaved || !parsedSaved.hideTopbar) return;
        e.preventDefault();
        if (container.getAttribute("data-topbar-hidden") === "1") {
            _showTopBarAnimated();
            parsedSaved.hideTopbar = true;
            localStorage.setItem("ws_active_theme", JSON.stringify(parsedSaved));
        } else {
            _hideTopBarAnimated(container);
            parsedSaved.hideTopbar = true;
            localStorage.setItem("ws_active_theme", JSON.stringify(parsedSaved));
        }
    });


    (function () {
        var touchTimer = null;
        var touchStartY = 0;
        var touchStartX = 0;

        function handleTouchToggle() {
            var container = document.getElementById("topBarContainer");
            if (!container) return;
            var saved = localStorage.getItem("ws_active_theme");
            var parsedSaved = null;
            if (saved) { try { parsedSaved = JSON.parse(saved); } catch (ex) { } }
            if (!parsedSaved || !parsedSaved.hideTopbar) return;
            if (container.getAttribute("data-topbar-hidden") === "1") {
                _showTopBarAnimated();
                parsedSaved.hideTopbar = true;
                localStorage.setItem("ws_active_theme", JSON.stringify(parsedSaved));
            } else {
                _hideTopBarAnimated(container);
                parsedSaved.hideTopbar = true;
                localStorage.setItem("ws_active_theme", JSON.stringify(parsedSaved));
            }
        }


        if (window.MSPointerEvent) {
            document.addEventListener("MSPointerDown", function (e) {
                if (e.pointerType === e.MSPOINTER_TYPE_TOUCH || e.pointerType === "touch") {
                    touchStartY = e.clientY;
                    touchStartX = e.clientX;
                    touchTimer = setTimeout(function () {
                        touchTimer = null;
                        handleTouchToggle();
                    }, 500);
                }
            }, false);
            document.addEventListener("MSPointerUp", function (e) {
                if (touchTimer !== null) { clearTimeout(touchTimer); touchTimer = null; }
            }, false);
            document.addEventListener("MSPointerMove", function (e) {
                if (touchTimer !== null) {
                    var dx = Math.abs(e.clientX - touchStartX);
                    var dy = Math.abs(e.clientY - touchStartY);
                    if (dx > 10 || dy > 10) { clearTimeout(touchTimer); touchTimer = null; }
                }
            }, false);
        } else if (window.PointerEvent) {
            document.addEventListener("pointerdown", function (e) {
                if (e.pointerType === "touch") {
                    touchStartY = e.clientY;
                    touchStartX = e.clientX;
                    touchTimer = setTimeout(function () {
                        touchTimer = null;
                        handleTouchToggle();
                    }, 500);
                }
            }, false);
            document.addEventListener("pointerup", function (e) {
                if (touchTimer !== null) { clearTimeout(touchTimer); touchTimer = null; }
            }, false);
            document.addEventListener("pointermove", function (e) {
                if (touchTimer !== null) {
                    var dx = Math.abs(e.clientX - touchStartX);
                    var dy = Math.abs(e.clientY - touchStartY);
                    if (dx > 10 || dy > 10) { clearTimeout(touchTimer); touchTimer = null; }
                }
            }, false);
        }
    })();


    var musicPlaylist = [];
    var currentMusicIndex = 0;

    var musicPlaylistNames = JSON.parse(localStorage.getItem("ws_music_playlist_names") || "[]");

    function renderSidebar() {
        if (localStorage.getItem("ws_sidebar_disabled") === "1") return;

        var existingSidebar = document.getElementById("leftSidebarContainer");
        if (existingSidebar) return;

        var sidebar = document.createElement("div");
        sidebar.id = "leftSidebarContainer";

        var css =
            '#leftSidebarContainer { position: fixed; top: 50px; left: 0; width: 250px; bottom: 0; background-color: rgba(0, 128, 0, 0.95); color: white; display: -ms-flexbox; display: flex; -ms-flex-direction: column; flex-direction: column; z-index: 9998; border-right: 1px solid #006400; font-family: "Segoe UI", sans-serif; transition: -ms-transform 0.3s ease, transform 0.3s ease; }' +
            '#leftSidebarContainer.minimized { -ms-transform: translateX(-250px); transform: translateX(-250px); }' +
            '#sidebarToggleBtn { position: fixed; left: 0px; top: 50px; width: 30px; height: 50px; background-color: green; color: white; text-align: center; line-height: 50px; cursor: pointer; font-family: "Segoe UI Symbol"; font-size: 16px; border-top-right-radius: 5px; border-bottom-right-radius: 5px; z-index: 10000; -ms-transition: left 0.3s ease; transition: left 0.3s ease; }' +
            '#leftSidebarContainer:not(.minimized) #sidebarToggleBtn { left: 250px; }' +
            '#leftSidebarContainer .sidebar-header { position: relative; padding: 10px 15px 5px 15px; font-size: 17px; font-weight: bold; border-bottom: 1px solid #006400; background-color: #006400; color: white; }' +
            '#sidebar-clock { font-size: 13px; font-weight: normal; color: #ccffcc; margin-top: 2px; letter-spacing: 1px; }' +
            '#leftSidebarContainer .sidebar-nav { -ms-flex: 1; flex: 1; list-style: none; padding: 0; margin: 0; overflow-y: auto; overflow-x: hidden; }' +
            '#leftSidebarContainer .sidebar-nav li { margin: 0; padding: 0; }' +
            '#leftSidebarContainer .sidebar-nav li a { display: block; padding: 12px 15px; color: #fff; text-decoration: none; font-size: 16px; border-bottom: 1px solid #007000; transition: background 0.2s; }' +
            '#leftSidebarContainer .sidebar-nav li a:hover { background-color: #007000; color: white; }' +
            '#leftSidebarContainer .sidebar-notes { padding: 10px 10px; border-top: 1px solid #006400; background-color: rgba(0, 0, 0, 0.2); -ms-box-sizing: border-box; box-sizing: border-box; }' +
            '#sidebar-notes-box { border: 2px solid #009900; border-radius: 4px; background: rgba(0,0,0,0.18); padding: 8px; -ms-box-sizing: border-box; box-sizing: border-box; width: 100%; }' +
            '#sidebar-notes-box .notes-label { font-size: 13px; font-weight: bold; margin-bottom: 5px; color: #ccffcc; }' +
            '#sidebarNotesArea { display: block; width: 100%; height: 90px; background: #fff; color: #333; border: none; padding: 6px; font-family: "Segoe UI", sans-serif; font-size: 13px; resize: none; border-radius: 2px; -ms-box-sizing: border-box; box-sizing: border-box; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; }' +
            '#leftSidebarContainer .sidebar-player { padding: 8px 10px; border-top: 1px solid #006400; background-color: #004d00; -ms-box-sizing: border-box; box-sizing: border-box; }' +
            '#btnSelectMusic { width: 100%; padding: 6px; margin-bottom: 6px; background-color: #007000; color: white; border: 1px solid #009000; cursor: pointer; font-size: 13px; }' +
            '#sidebar-shuffle-repeat { font-size: 12px; display: -ms-flexbox; display: flex; -ms-flex-pack: justify; justify-content: space-between; margin-bottom: 5px; }' +
            '#sidebar-track-info { font-size: 12px; color: #ccffcc; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 16px; }' +
            '#sidebar-seek-bar { width: 100%; height: 4px; background: #006400; cursor: pointer; margin-bottom: 5px; outline: none; -ms-appearance: none; appearance: none; border-radius: 2px; }' +
            '#sidebar-seek-bar::-ms-fill-lower { background: #00cc00; }' +
            '#sidebar-seek-bar::-ms-thumb { width: 12px; height: 12px; background: white; border-radius: 50%; border: none; }' +
            '#sidebar-controls { display: -ms-flexbox; display: flex; -ms-flex-align: center; align-items: center; -ms-flex-pack: center; justify-content: center; margin-bottom: 5px; }' +
            '#sidebar-controls button { background: none; border: none; color: white; cursor: pointer; font-family: "Segoe UI Symbol"; font-size: 18px; padding: 0 8px; line-height: 1; }' +
            '#sidebar-controls button:hover { color: #ccffcc; }' +
            '#sidebar-play-pause { font-size: 22px !important; }' +
            '#sidebar-time { font-size: 11px; color: #99dd99; text-align: right; margin-bottom: 4px; }' +
            '#sidebar-playlist { max-height: 80px; overflow-y: auto; margin-top: 4px; border: 1px solid #006400; border-radius: 2px; background: rgba(0,0,0,0.25); }' +
            '#sidebar-playlist div { padding: 3px 8px; font-size: 12px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e0ffe0; border-bottom: 1px solid #005500; }' +
            '#sidebar-playlist div:last-child { border-bottom: none; }' +
            '#sidebar-playlist div:hover { background: #007000; }' +
            '#sidebar-playlist div.active-track { background: #005500; color: #fff; font-weight: bold; }' +
            'body { transition: padding-left 0.3s ease; padding-left: 250px !important; }' +
            'body.sidebar-minimized { padding-left: 0px !important; }';

        var styleTag = document.createElement("style");
        styleTag.type = "text/css";

        var sidebarHtml =
            '<div class="sidebar-header">' +
                currentT.quickAccessHeader +
                '<div id="sidebar-clock"></div>' +
                '<div id="sidebarToggleBtn">&#xE112;</div>' +
            '</div>' +
            '<ul class="sidebar-nav">' +
                '<li><a href="default.html">' + currentT.openHome + '</a></li>' +
                '<li><a href="ChartsPage.html">' + currentT.openCharts + '</a></li>' +
                '<li><a href="Categories.html">' + currentT.openCategories + '</a></li>' +
                '<li><a href="AllApps.html">' + currentT.openAllApps + '</a></li>' +
            '</ul>' +
            '<div class="sidebar-notes">' +
                '<div id="sidebar-notes-box">' +
                    '<div class="notes-label">' + currentT.notes + '</div>' +
                    '<textarea id="sidebarNotesArea" placeholder="' + currentT.notesPlaceholder + '"></textarea>' +
                '</div>' +
            '</div>' +
            '<div class="sidebar-player">' +
                '<button id="btnSelectMusic">' + currentT.selectMusic + '</button>' +
                '<div id="sidebar-shuffle-repeat">' +
                    '<label><input type="checkbox" id="chkMusicShuffle" /> ' + currentT.shuffle + '</label>' +
                    '<label><input type="checkbox" id="chkMusicRepeat" checked /> ' + currentT.repeat + '</label>' +
                '</div>' +
                '<div id="sidebar-track-info">&#x266B; -</div>' +
                '<input type="range" id="sidebar-seek-bar" min="0" max="100" value="0" />' +
                '<div id="sidebar-time">0:00 / 0:00</div>' +
                '<div id="sidebar-controls">' +
                    '<button id="sidebar-prev" title="Vorheriger Titel">&#xE100;</button>' +
                    '<button id="sidebar-play-pause" title="Abspielen/Pause">&#xE102;</button>' +
                    '<button id="sidebar-next" title="N\u00e4chster Titel">&#xE101;</button>' +
                '</div>' +
                '<div id="sidebar-playlist"></div>' +
                '<audio id="sidebarAudioPlayer" style="display:none;">' +
                    '<source src="" type="audio/mpeg" />' +
                '</audio>' +
            '</div>';

        MSApp.execUnsafeLocalFunction(function () {
            styleTag.innerHTML = css;
            sidebar.innerHTML = sidebarHtml;
        });

        document.head.appendChild(styleTag);
        document.body.appendChild(sidebar);


        if (localStorage.getItem("ws_sidebar_minimized") === "1") {
            sidebar.className += " minimized";
            document.body.className += " sidebar-minimized";
            document.getElementById("sidebarToggleBtn").innerHTML = "&#xE111;";
        }


        var clockEl = document.getElementById("sidebar-clock");
        function updateClock() {
            var now = new Date();
            var h = now.getHours();
            var m = now.getMinutes();
            var s = now.getSeconds();
            if (h < 10) h = "0" + h;
            if (m < 10) m = "0" + m;
            if (s < 10) s = "0" + s;
            clockEl.innerText = h + ":" + m + ":" + s;
        }
        updateClock();
        setInterval(updateClock, 1000);


        var notesArea = document.getElementById("sidebarNotesArea");
        notesArea.value = localStorage.getItem("ws_sidebar_notes") || "";
        notesArea.addEventListener("input", function () {
            localStorage.setItem("ws_sidebar_notes", notesArea.value);
        });


        var toggleBtn = document.getElementById("sidebarToggleBtn");
        toggleBtn.addEventListener("click", function () {
            var isMinimized = sidebar.className.indexOf("minimized") > -1;
            if (isMinimized) {
                sidebar.className = sidebar.className.replace("minimized", "").trim();
                document.body.className = document.body.className.replace("sidebar-minimized", "").trim();
                toggleBtn.innerHTML = "&#xE112;";
                localStorage.setItem("ws_sidebar_minimized", "0");
            } else {
                sidebar.className += " minimized";
                document.body.className += " sidebar-minimized";
                toggleBtn.innerHTML = "&#xE111;";
                localStorage.setItem("ws_sidebar_minimized", "1");
            }
        });


        var audioPlayer = document.getElementById("sidebarAudioPlayer");
        var seekBar = document.getElementById("sidebar-seek-bar");
        var timeDisplay = document.getElementById("sidebar-time");
        var trackInfo = document.getElementById("sidebar-track-info");
        var playPauseBtn = document.getElementById("sidebar-play-pause");
        var playlistEl = document.getElementById("sidebar-playlist");
        var isPlaying = false;
        var isSeeking = false;

        function formatTime(sec) {
            if (isNaN(sec) || !isFinite(sec)) return "0:00";
            var m = Math.floor(sec / 60);
            var s = Math.floor(sec % 60);
            if (s < 10) s = "0" + s;
            return m + ":" + s;
        }

        function updatePlaylistUI() {
            var html = "";
            for (var i = 0; i < musicPlaylist.length; i++) {
                var name = musicPlaylist[i].name || ("Track " + (i + 1));
                var activeClass = (i === currentMusicIndex) ? " active-track" : "";
                html += '<div data-idx="' + i + '" class="' + activeClass + '">' + (i + 1) + '. ' + name + '</div>';
            }
            MSApp.execUnsafeLocalFunction(function () {
                playlistEl.innerHTML = html;
            });
            var items = playlistEl.querySelectorAll("div");
            for (var j = 0; j < items.length; j++) {
                (function (item) {
                    item.onclick = function () {
                        var idx = parseInt(item.getAttribute("data-idx"), 10);
                        playMusicTrack(idx);
                    };
                })(items[j]);
            }
        }

        function playMusicTrack(index) {
            if (!musicPlaylist || musicPlaylist.length === 0) return;
            if (index < 0) {
                index = musicPlaylist.length - 1;
            }
            if (index >= musicPlaylist.length) {
                if (document.getElementById("chkMusicRepeat").checked) {
                    index = 0;
                } else {
                    isPlaying = false;
                    playPauseBtn.innerHTML = "&#xE102;";
                    return;
                }
            }
            currentMusicIndex = index;
            var file = musicPlaylist[index];
            var audioUrl = URL.createObjectURL(file);
            audioPlayer.src = audioUrl;
            audioPlayer.play();
            isPlaying = true;
            playPauseBtn.innerHTML = "&#xE103;";
            trackInfo.innerText = "\u266B " + (file.name || ("Track " + (index + 1)));
            seekBar.value = 0;
            localStorage.setItem("ws_music_current_index", index);
            updatePlaylistUI();
        }

        audioPlayer.addEventListener("timeupdate", function () {
            if (!isSeeking && audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                seekBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                timeDisplay.innerText = formatTime(audioPlayer.currentTime) + " / " + formatTime(audioPlayer.duration);
            }
        });

        seekBar.onmousedown = function () { isSeeking = true; };
        seekBar.onmouseup = function () {
            isSeeking = false;
            if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
            }
        };
        seekBar.onchange = function () {
            if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
            }
        };

        playPauseBtn.onclick = function () {
            if (musicPlaylist.length === 0) return;
            if (isPlaying) {
                audioPlayer.pause();
                isPlaying = false;
                playPauseBtn.innerHTML = "&#xE102;";
            } else {
                audioPlayer.play();
                isPlaying = true;
                playPauseBtn.innerHTML = "&#xE103;";
            }
        };

        document.getElementById("sidebar-prev").onclick = function () {
            playMusicTrack(currentMusicIndex - 1);
        };

        document.getElementById("sidebar-next").onclick = function () {
            playMusicTrack(currentMusicIndex + 1);
        };

        audioPlayer.addEventListener("ended", function () {
            var isShuffle = document.getElementById("chkMusicShuffle").checked;
            if (isShuffle) {
                var nextIndex = Math.floor(Math.random() * musicPlaylist.length);
                playMusicTrack(nextIndex);
            } else {
                playMusicTrack(currentMusicIndex + 1);
            }
        });


        var btnSelectMusic = document.getElementById("btnSelectMusic");
        btnSelectMusic.addEventListener("click", function () {
            if (typeof Windows !== "undefined" && Windows.Storage && Windows.Storage.Pickers) {
                var picker = new Windows.Storage.Pickers.FileOpenPicker();
                picker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
                picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.musicLibrary;
                picker.fileTypeFilter.replaceAll([".mp3", ".wav", ".m4a", ".wma"]);

                picker.pickMultipleFilesAsync().then(function (files) {
                    if (files && files.size > 0) {
                        musicPlaylist = [];
                        musicPlaylistNames = [];
                        for (var i = 0; i < files.size; i++) {
                            musicPlaylist.push(files[i]);
                            musicPlaylistNames.push(files[i].name || ("Track " + (i + 1)));
                        }
                        localStorage.setItem("ws_music_playlist_names", JSON.stringify(musicPlaylistNames));
                        currentMusicIndex = 0;
                        playMusicTrack(currentMusicIndex);
                    }
                });
            }
        });


        if (musicPlaylistNames.length > 0) {
            var html = "";
            for (var k = 0; k < musicPlaylistNames.length; k++) {
                html += '<div style="color:#99cc99;" data-idx="' + k + '">' + (k + 1) + '. ' + musicPlaylistNames[k] + '</div>';
            }
            MSApp.execUnsafeLocalFunction(function () {
                playlistEl.innerHTML = html;
            });
        }
    }

    function renderTopBar() {
        var container = document.getElementById("topBarContainer");
        if (!container) return;
        if (container.innerHTML !== "") return;

        var topBarHtml =
            '<style>' +
                '.topBar { list-style: none; padding: 0; margin: 0; display: flex; align-items: center; background: green; height: 50px; }' +
                '.topBar .nav-slot { width: 20ch; flex-shrink: 0; list-style: none; text-align: left; overflow: hidden; margin-right: 20px; }' +
                '.topBar .nav-link { text-decoration: none; color: white !important; font-size: 19px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; width: 100%; }' +
                '.topBar .logo-home-container { display: flex; align-items: center; width: 250px; flex-shrink: 0; text-decoration: none; color: white !important; cursor: pointer; }' +
                '.topBar .logo-home-container li { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
                '.topBar .search-icon { cursor: default; }' +
            '</style>' +
            '<ul class="topBar">' +
                '<a href="default.html" class="logo-home-container">' +
                    '<li style="list-style:none; margin-left: 37px; width: 40px; height: 30px; flex-shrink: 0;"><img src="images/smalllogo.scale-100.png" style="width: 30px;" /></li>' +
                    '<li style="list-style:none; font-size: 19px; margin-left: 5px; overflow: hidden; text-overflow: ellipsis; max-width: 12ch;">' + currentT.home + '</li>' +
                '</a>' +
                '<li class="nav-slot"><a href="ChartsPage.html" class="nav-link">' + currentT.charts + '</a></li>' +
                '<li class="nav-slot"><a href="Categories.html" class="nav-link">' + currentT.categories + '</a></li>' +
                '<li class="nav-slot"><a href="AllApps.html" class="nav-link">' + currentT.allApps + '</a></li>' +
                '<li class="nav-slot"><a href="AccountPage.html" class="nav-link">' + currentT.account + '</a></li>' +
                '<li class="nav-slot" style="margin-left: auto; width: auto; margin-right: 20px;"><a href="LoginPage.html" id="logoutBtn" class="nav-link">' + currentT.logout + '</a></li>' +
                '<li style="margin-right: 40px; list-style: none; flex-shrink: 0;">' +
                    '<form id="searchForm" class="search-container" style="border-radius: 15px;">' +
                        '<input type="text" id="searchBar" placeholder="' + currentT.search + '" style="border-radius: 15px;" />' +
                        '<span class="search-icon">&#xE11A;</span>' +
                    '</form>' +
                '</li>' +
            '</ul>';

        MSApp.execUnsafeLocalFunction(function () {
            container.innerHTML = topBarHtml;
        });

        var searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.onsubmit = function (e) {
                e.preventDefault();
                var query = document.getElementById('searchBar').value;
                if (query) window.location.href = "AllApps.html?search=" + encodeURIComponent(query);
            };
        }

        var logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function () {
            });
        }

        var activeThemeSaved = localStorage.getItem("ws_active_theme");
        if (activeThemeSaved) {
            try {
                var parsedTheme = JSON.parse(activeThemeSaved);
                if (parsedTheme && parsedTheme.hideTopbar) {
                    var navLinks = container.querySelectorAll("a");
                    for (var ni = 0; ni < navLinks.length; ni++) {
                        navLinks[ni].onclick = function (e) {
                            var href = this.getAttribute("href");
                            if (href) {
                                e.preventDefault();
                                _hideTopBarAnimated(container);
                                var dest = href;
                                setTimeout(function () {
                                    window.location.href = dest;
                                }, 380);
                            }
                        };
                    }
                }
            } catch (ex) { }
        }
    }

    function openFileFromLocalFolder(fileName) {
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync(fileName).then(function (file) {
            return Windows.System.Launcher.launchFileAsync(file);
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        renderTopBar(); renderSidebar(); applySavedTheme(); loadTranslations();
    } else {
        document.addEventListener("DOMContentLoaded", function () { renderTopBar(); renderSidebar(); applySavedTheme(); loadTranslations(); });
    }

    WinJS.Application.start();
})();
// ==========================================
// PARCHE DE DEIDAD: DOMAR LA MALDITA BARRA VERDE
// ==========================================
(function() {
    var estiloCharms = document.createElement("style");
    estiloCharms.innerHTML = "" +
        ".sidebar, #navigation-menu, .nav-panel, [class*='I want to'] {" +
        "   position: fixed !important;" +
        "   left: -320px !important;" +
        "   top: 0 !important;" +
        "   width: 300px !important;" +
        "   height: 100vh !important;" +
        "   background-color: #228B22 !important;" +
        "   transition: left 0.2s ease-in-out !important;" +
        "   z-index: 9999 !important;" +
        "   box-shadow: 5px 0 15px rgba(0,0,0,0.5) !important;" +
        "}" +
        ".sidebar.visible, #navigation-menu.visible, .nav-panel.visible {" +
        "   left: 0 !important;" +
        "}";
    document.head.appendChild(estiloCharms);

    document.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        var bar = document.querySelector(".sidebar") || document.getElementById("navigation-menu") || document.querySelector(".nav-panel");
        if (bar) { bar.classList.toggle("visible"); }
    });

    document.addEventListener("mousemove", function(e) {
        var bar = document.querySelector(".sidebar") || document.getElementById("navigation-menu") || document.querySelector(".nav-panel");
        var h = window.innerHeight;
        if (bar && e.clientX <= 12 && (e.clientY <= 12 || e.clientY >= h - 12)) {
            bar.className += " visible";
        }
    });

    document.addEventListener("click", function(e) {
        var bar = document.querySelector(".sidebar") || document.getElementById("navigation-menu") || document.querySelector(".nav-panel");
        if (bar && !bar.contains(e.target)) {
            bar.classList.remove("visible");
        }
    });
})();
