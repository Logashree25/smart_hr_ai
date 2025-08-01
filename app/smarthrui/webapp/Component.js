sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device"
], function (UIComponent, Device) {
    "use strict";

    return UIComponent.extend("smart.hr.portal.Component", {

        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Create device model
            this.setModel(new sap.ui.model.json.JSONModel(Device), "device");

            // Enable routing
            this.getRouter().initialize();

            console.log("Smart HR Portal Component initialized successfully");
        }
    });
});
