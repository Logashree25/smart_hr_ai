sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("smarthrui.controller.Analytics", {

        onInit: function () {
            this.getRouter().getRoute("RouteAnalytics").attachPatternMatched(this._onObjectMatched, this);
            this._loadAnalyticsData();
        },

        _onObjectMatched: function () {
            this._loadAnalyticsData();
        },

        _loadAnalyticsData: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("view");
            
            // Load periods for filter
            this._loadPeriods();
            
            // Calculate average satisfaction score
            this._calculateAverageSatisfaction();
        },

        _loadPeriods: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("view");
            
            oModel.bindList("/PerformanceMetrics").requestContexts().then(function (aContexts) {
                var aPeriods = [];
                aContexts.forEach(function (oContext) {
                    var sPeriod = oContext.getProperty("Period");
                    if (aPeriods.indexOf(sPeriod) === -1) {
                        aPeriods.push(sPeriod);
                    }
                });
                oViewModel.setProperty("/periods", aPeriods.sort());
            });
        },

        _calculateAverageSatisfaction: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("view");
            
            oModel.bindList("/SatisfactionSurvey").requestContexts().then(function (aContexts) {
                if (aContexts.length > 0) {
                    var iTotalScore = aContexts.reduce(function (sum, oContext) {
                        return sum + (oContext.getProperty("Score") || 0);
                    }, 0);
                    var iAvgScore = Math.round(iTotalScore / aContexts.length);
                    oViewModel.setProperty("/avgSatisfactionScore", iAvgScore);
                } else {
                    oViewModel.setProperty("/avgSatisfactionScore", 0);
                }
            });
        },

        onRefreshDepartments: function () {
            this.byId("departmentAnalyticsTable").getBinding("items").refresh();
            MessageToast.show("Department data refreshed");
        },

        onRefreshAttritionRisk: function () {
            this.byId("attritionRiskTable").getBinding("items").refresh();
            MessageToast.show("Attrition risk data refreshed");
        },

        onRefreshPerformance: function () {
            this.byId("performanceMetricsTable").getBinding("items").refresh();
            MessageToast.show("Performance data refreshed");
        },

        onAnalyzeTeam: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var sDepartment = oBindingContext.getProperty("Department");
            
            this._analyzeTeamPerformance(sDepartment);
        },

        _analyzeTeamPerformance: function (sDepartment) {
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            
            MessageBox.confirm("Generate team performance analysis for " + sDepartment + " department?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._callTeamAnalysisAction(sDepartment);
                    }
                }
            });
        },

        _callTeamAnalysisAction: function (sDepartment) {
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            
            // Show loading
            this.getView().setBusy(true);
            
            var oAction = oModel.bindContext("/analyzeTeamPerformance(...)");
            oAction.setParameter("department", sDepartment);
            
            oAction.execute().then(function () {
                that.getView().setBusy(false);
                var sResult = oAction.getBoundContext().getProperty("value");
                
                MessageBox.information("Team Performance Analysis for " + sDepartment + ":\n\n" + sResult, {
                    styleClass: "sapUiSizeCompact",
                    contentWidth: "35rem"
                });
                
            }).catch(function (oError) {
                that.getView().setBusy(false);
                MessageBox.error("Error generating team analysis: " + (oError.message || "Unknown error"));
            });
        },

        onPeriodFilterChange: function () {
            var oViewModel = this.getView().getModel("view");
            var sPeriod = oViewModel.getProperty("/selectedPeriod");
            var oTable = this.byId("performanceMetricsTable");
            var oBinding = oTable.getBinding("items");
            
            if (sPeriod) {
                var oFilter = new Filter("Period", FilterOperator.EQ, sPeriod);
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },

        onPerformancePress: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oBindingContext.getProperty("EmployeeID_ID");
            
            this.getRouter().navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        }
    });
});
