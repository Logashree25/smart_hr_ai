sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "smarthrui/model/models",
    "sap/m/MessageToast"
], function (Controller, models, MessageToast) {
    "use strict";

    return Controller.extend("smarthrui.controller.App", {

        onInit: function () {
            // Set view model
            var oViewModel = models.createViewModel();
            this.getView().setModel(oViewModel, "view");

            // Load KPI data
            this._loadKPIs();
        },

        _loadKPIs: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("view");

            // Initialize KPIs
            oViewModel.setProperty("/kpis", {
                totalEmployees: 0,
                keyTalent: 0,
                openPositions: 0
            });

            // Load total employees
            oModel.bindList("/Employees").requestContexts().then(function (aContexts) {
                var iTotalEmployees = aContexts.length;
                var iKeyTalent = aContexts.filter(function (oContext) {
                    return oContext.getProperty("IsKeyTalent");
                }).length;

                oViewModel.setProperty("/kpis/totalEmployees", iTotalEmployees);
                oViewModel.setProperty("/kpis/keyTalent", iKeyTalent);
            });

            // Load open positions
            oModel.bindList("/OpenPositions").requestContexts().then(function (aContexts) {
                oViewModel.setProperty("/kpis/openPositions", aContexts.length);
            });
        },

        onDashboardPress: function () {
            MessageToast.show("Dashboard functionality - showing employee overview");
        },

        onEmployeesPress: function () {
            MessageToast.show("Employee Management - view and manage employees");
        },

        onAnalyticsPress: function () {
            MessageToast.show("Analytics - HR insights and reporting");
        },

        onAIPress: function () {
            MessageToast.show("AI Insights - AI-powered recommendations");
        }
    });
});
