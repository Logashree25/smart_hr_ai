sap.ui.define([
    "sap/ui/core/ComponentContainer"
], function (ComponentContainer) {
    "use strict";

    /**
     * Initialize the Smart HR Portal application
     * This module is called during UI5 bootstrap to start the application
     */
    
    // Hide splash screen when app is ready
    function hideSplashScreen() {
        var splashScreen = document.getElementById("splash-screen");
        if (splashScreen) {
            splashScreen.style.opacity = "0";
            splashScreen.style.transition = "opacity 0.3s ease-out";
            setTimeout(function() {
                splashScreen.style.display = "none";
            }, 300);
        }
    }

    // Create and start the UI5 component
    try {
        var oComponentContainer = new ComponentContainer({
            name: "smart.hr.portal",
            settings: {
                id: "smart.hr.portal"
            },
            async: true
        });

        oComponentContainer.placeAt("app-container");

        console.log("Smart HR Portal component container created");

        // Hide splash screen after a delay to allow component to load
        setTimeout(function() {
            console.log("Hiding splash screen...");
            hideSplashScreen();
        }, 3000);

    } catch (oError) {
        // Handle component loading error
        console.error("Error loading Smart HR Portal component:", oError);
        hideSplashScreen();

        // Show error message to user
        var container = document.getElementById("app-container");
        if (container) {
            container.innerHTML =
                '<div style="padding: 40px; text-align: center; font-family: \'72\', Arial, sans-serif;">' +
                    '<h2 style="color: #d32f2f; margin-bottom: 20px;">Application Error</h2>' +
                    '<p style="color: #666; margin-bottom: 20px;">Sorry, the Smart HR Portal could not be loaded.</p>' +
                    '<p style="color: #666; font-size: 14px;">Error: ' + oError.message + '</p>' +
                    '<button onclick="window.location.reload()" style="' +
                        'background: #0070f2; color: white; border: none; padding: 10px 20px; ' +
                        'border-radius: 4px; cursor: pointer; margin-top: 20px; font-size: 14px;' +
                    '">Refresh Page</button>' +
                '</div>';
        }
    }
});
