sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("smarthrui.controller.Main", {

        onInit: function () {
            this.getRouter().getRoute("RouteMain").attachPatternMatched(this._onObjectMatched, this);
            this._loadDashboardData();
        },

        _onObjectMatched: function () {
            this._loadDashboardData();
        },

        _loadDashboardData: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("view");

            // Load KPIs
            this._loadKPIs(oModel, oViewModel);
        },

        _loadKPIs: function (oModel, oViewModel) {
            var that = this;
            
            // Initialize KPIs
            oViewModel.setProperty("/kpis", {
                totalEmployees: 0,
                keyTalent: 0,
                openPositions: 0,
                avgSatisfaction: 0
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
            oModel.bindList("/OpenPositions", null, null, 
                [new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "open")]
            ).requestContexts().then(function (aContexts) {
                oViewModel.setProperty("/kpis/openPositions", aContexts.length);
            });

            // Load average satisfaction
            oModel.bindList("/SatisfactionSurvey").requestContexts().then(function (aContexts) {
                if (aContexts.length > 0) {
                    var iTotalScore = aContexts.reduce(function (sum, oContext) {
                        return sum + (oContext.getProperty("Score") || 0);
                    }, 0);
                    var iAvgSatisfaction = Math.round(iTotalScore / aContexts.length);
                    oViewModel.setProperty("/kpis/avgSatisfaction", iAvgSatisfaction);
                }
            });
        },

        onRefreshDepartments: function () {
            this.byId("departmentTable").getBinding("items").refresh();
            MessageToast.show("Department data refreshed");
        },

        onDepartmentPress: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var sDepartment = oBindingContext.getProperty("Department");
            
            this.getRouter().navTo("RouteEmployees", {}, {
                query: {
                    department: sDepartment
                }
            });
        },

        onEmployeePress: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oBindingContext.getProperty("ID");
            
            this.getRouter().navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        }
    });
});
