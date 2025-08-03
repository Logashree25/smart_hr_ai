sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("smarthrui.controller.Employees", {

        onInit: function () {
            this.getRouter().getRoute("RouteEmployees").attachPatternMatched(this._onObjectMatched, this);
            this._oTable = this.byId("employeeTable");
        },

        _onObjectMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var oQuery = oArgs["?query"] || {};
            
            // Apply department filter if provided
            if (oQuery.department) {
                this.getView().getModel("view").setProperty("/selectedDepartment", oQuery.department);
                this._applyFilters();
            }
            
            this._updateEmployeeCount();
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            this._applyFilters(sQuery);
        },

        onDepartmentFilterChange: function () {
            this._applyFilters();
        },

        _applyFilters: function (sSearchQuery) {
            var aFilters = [];
            var oViewModel = this.getView().getModel("view");
            
            // Search filter
            if (sSearchQuery) {
                var oSearchFilter = new Filter({
                    filters: [
                        new Filter("FirstName", FilterOperator.Contains, sSearchQuery),
                        new Filter("LastName", FilterOperator.Contains, sSearchQuery),
                        new Filter("Role", FilterOperator.Contains, sSearchQuery)
                    ],
                    and: false
                });
                aFilters.push(oSearchFilter);
            }
            
            // Department filter
            var sDepartment = oViewModel.getProperty("/selectedDepartment");
            if (sDepartment) {
                aFilters.push(new Filter("Department", FilterOperator.EQ, sDepartment));
            }
            
            this._oTable.getBinding("items").filter(aFilters);
            this._updateEmployeeCount();
        },

        _updateEmployeeCount: function () {
            var oBinding = this._oTable.getBinding("items");
            var that = this;
            
            if (oBinding) {
                oBinding.requestContexts().then(function (aContexts) {
                    that.getView().getModel("view").setProperty("/employeeCount", aContexts.length);
                });
            }
        },

        onRefresh: function () {
            this._oTable.getBinding("items").refresh();
            MessageToast.show("Employee data refreshed");
        },

        onEmployeePress: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oBindingContext.getProperty("ID");
            
            this.getRouter().navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        onViewEmployee: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oBindingContext.getProperty("ID");
            
            this.getRouter().navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        onGenerateInsights: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oBindingContext.getProperty("ID");
            var sEmployeeName = oBindingContext.getProperty("FirstName") + " " + oBindingContext.getProperty("LastName");
            
            this._generateEmployeeInsights(sEmployeeId, sEmployeeName);
        },

        _generateEmployeeInsights: function (sEmployeeId, sEmployeeName) {
            var that = this;
            
            MessageBox.confirm("Generate AI insights for " + sEmployeeName + "?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._callAIAction("generateAttritionRisk", { employeeId: sEmployeeId }, sEmployeeName);
                    }
                }
            });
        },

        _callAIAction: function (sActionName, oParameters, sEmployeeName) {
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            
            var oAction = oModel.bindContext("/" + sActionName + "(...)");
            oAction.setParameter("employeeId", oParameters.employeeId);
            
            oAction.execute().then(function () {
                var sResult = oAction.getBoundContext().getProperty("value");
                MessageBox.information("AI Insights for " + sEmployeeName + ":\n\n" + sResult);
            }).catch(function (oError) {
                MessageBox.error("Error generating insights: " + oError.message);
            });
        },

        onExport: function () {
            MessageToast.show("Export functionality would be implemented here");
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        }
    });
});
