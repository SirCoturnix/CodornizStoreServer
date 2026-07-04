(function () {
    "use strict";

    // --- CONFIGURACIÓN E IDIOMAS ---
    var translations = {
        "es": {
            "title": "KiwiStore",
            "apps": "Aplicaciones",
            "downloads": "Descargas",
            "account": "Mi Cuenta",
            "wishlist": "Wishlist",
            "search": "Buscar...",
            "featured": "Destacados",
            "moreApps": "Más aplicaciones",
            "free": "Gratis",
            "games": "Juegos",
            "foodProd": "Comida y Productividad",
            "tech": "Tecnología",
            "allApps": "Todas las aplicaciones",
            "back": "Volver",
            "downloadQueue": "Cola de descargas",
            "noDownloads": "No hay descargas pendientes en este momento.",
            "myAccountTitle": "Mi Cuenta Codorniz",
            "familyUser": "Usuario Familiar",
            "devStatus": "Desarrollador Gold Codorniz",
            "staticServer": "Servidor de Estáticos",
            "downloadServer": "Servidor de Descargas",
            "wishlistTitle": "Wishlist Codorniz Nativa"
        },
        "en": {
            "title": "KiwiStore",
            "apps": "Apps",
            "downloads": "Downloads",
            "account": "My Account",
            "wishlist": "Wishlist",
            "search": "Search...",
            "featured": "Featured",
            "moreApps": "More apps",
            "free": "Free",
            "games": "Games",
            "foodProd": "Food & Productivity",
            "tech": "Technology",
            "allApps": "All apps",
            "back": "Back",
            "downloadQueue": "Download queue",
            "noDownloads": "No pending downloads at this moment.",
            "myAccountTitle": "My Codorniz Account",
            "familyUser": "Family User",
            "devStatus": "Codorniz Gold Developer",
            "staticServer": "Static Server",
            "downloadServer": "Download Server",
            "wishlistTitle": "Native Codorniz Wishlist"
        }
    };

    var currentLang = localStorage.getItem("lang") || "es";
    var t = translations[currentLang];

    // --- LÓGICA DE APLICACIÓN ---
    WinJS.Application.onactivated = function (args) {
        if (args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            args.setPromise(WinJS.UI.processAll().then(function () {
                renderUI();
                initSidebar();
            }));
        }
    };

    // --- RENDERIZADO DINÁMICO (Basado en tus capturas) ---
    function renderUI() {
        // Actualizar textos basados en las capturas
        var el = document.getElementById("nav-apps"); if(el) el.innerText = t.apps;
        el = document.getElementById("nav-downloads"); if(el) el.innerText = t.downloads;
        el = document.getElementById("nav-account"); if(el) el.innerText = t.account;
        el = document.getElementById("nav-wishlist"); if(el) el.innerText = t.wishlist;
        
        // Renderizado específico según página detectada
        var path = window.location.pathname;
        if (path.includes("Downloads.html")) {
            document.getElementById("page-title").innerText = t.downloadQueue;
            document.getElementById("status-message").innerText = t.noDownloads;
        } else if (path.includes("Account.html")) {
            document.getElementById("page-title").innerText = t.myAccountTitle;
            // Lógica para mostrar info de usuario familiar y servidores
        } else if (path.includes("Wishlist.html")) {
            document.getElementById("page-title").innerText = t.wishlistTitle;
        }
    }

    // --- LÓGICA DE DESCARGAS ---
    function iniciarDescarga(url, nombreArchivo) {
        var downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();
        var uri = new Windows.Foundation.Uri(url);
        var folder = Windows.Storage.ApplicationData.current.localFolder;
        
        folder.createFileAsync(nombreArchivo, Windows.Storage.CreationCollisionOption.replaceExisting)
            .then(function (file) {
                var download = downloader.createDownload(uri, file);
                return download.startAsync();
            })
            .done(function () {
                var toast = Windows.UI.Notifications.ToastTemplateType.toastText02;
                var xml = Windows.UI.Notifications.ToastNotificationManager.getTemplateContent(toast);
                xml.getElementsByTagName("text")[0].innerText = "KiwiStore";
                xml.getElementsByTagName("text")[1].innerText = nombreArchivo + " descargado.";
                Windows.UI.Notifications.ToastNotificationManager.createToastNotifier().show(new Windows.UI.Notifications.ToastNotification(xml));
            });
    }

    // --- PARCHE DE DEIDAD (Sidebar/Charms) ---
    function initSidebar() {
        var style = document.createElement("style");
        style.innerHTML = ".sidebar { position: fixed; left: -320px; top: 0; width: 300px; height: 100vh; " +
                          "background-color: #228B22; transition: left 0.3s ease; z-index: 9999; } " +
                          ".sidebar.visible { left: 0; }";
        document.head.appendChild(style);

        document.addEventListener("keydown", function(e) {
            if (e.key === "c" && e.ctrlKey) { // Ejemplo para activar sidebar
                document.querySelector(".sidebar").classList.toggle("visible");
            }
        });
    }
function iniciarDescarga(url, nombreArchivo) {
    alert("¡Pulsaste el botón! Iniciando descarga..."); // <-- Esto nos dice si el botón funciona
    
    var downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();
    // ... (resto de tu código de descarga) ...

    .done(function () {
        alert("Descarga terminada, intentando lanzar el instalador..."); // <-- Esto nos dice si llega al final
        
        var options = new Windows.System.LauncherOptions();
        options.targetApplicationPackageFamilyName = "Microsoft.DesktopAppInstaller_8wekyb3d8bbwe";
        
        Windows.System.Launcher.launchFileAsync(fileObj, options).done(function (success) {
            if (!success) {
                alert("El Launcher devolvió 'false'.");
            }
        }, function(error) {
            alert("Error del sistema: " + error.message);
        });
    });
}
    WinJS.Application.start();
})();