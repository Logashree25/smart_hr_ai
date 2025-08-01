sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("smart.hr.portal.controller.Dashboard", {

        onInit: function () {
            console.log("Dashboard controller initialized");
        },

        onEmployeePress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeName = oContext.getProperty("firstName") + " " + oContext.getProperty("lastName");
            MessageToast.show("Selected employee: " + sEmployeeName);
        }
    });
});
