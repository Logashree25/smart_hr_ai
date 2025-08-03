sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("smarthrui.controller.EmployeeDetail", {

        onInit: function () {
            this.getRouter().getRoute("RouteEmployeeDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sEmployeeId = oEvent.getParameter("arguments").employeeId;
            this._bindView("/Employees('" + sEmployeeId + "')");
        },

        _bindView: function (sObjectPath) {
            var oView = this.getView();
            
            oView.bindElement({
                path: sObjectPath,
                parameters: {
                    $expand: "Manager,PerformanceData,SurveyResponses,FeedbackReceived,AttritionRisk"
                },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oView.setBusy(true);
                    },
                    dataReceived: function () {
                        oView.setBusy(false);
                    }
                }
            });
        },

        _onBindingChange: function () {
            var oView = this.getView();
            var oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("notFound");
                return;
            }
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("RouteEmployees", {}, true);
            }
        },

        onGenerateAttritionRisk: function () {
            var oBindingContext = this.getView().getBindingContext();
            var sEmployeeId = oBindingContext.getProperty("ID");
            var sEmployeeName = oBindingContext.getProperty("FirstName") + " " + oBindingContext.getProperty("LastName");
            
            this._callAIAction("generateAttritionRisk", sEmployeeId, sEmployeeName);
        },

        onGenerateTrainingRecommendations: function () {
            var oBindingContext = this.getView().getBindingContext();
            var sEmployeeId = oBindingContext.getProperty("ID");
            var sEmployeeName = oBindingContext.getProperty("FirstName") + " " + oBindingContext.getProperty("LastName");
            
            this._callAIAction("generateTrainingRecommendations", sEmployeeId, sEmployeeName);
        },

        _callAIAction: function (sActionName, sEmployeeId, sEmployeeName) {
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            
            MessageBox.confirm("Generate " + sActionName.replace(/([A-Z])/g, ' $1').toLowerCase() + " for " + sEmployeeName + "?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._executeAIAction(sActionName, sEmployeeId, sEmployeeName);
                    }
                }
            });
        },

        _executeAIAction: function (sActionName, sEmployeeId, sEmployeeName) {
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            
            // Show loading
            this.getView().setBusy(true);
            
            var oAction = oModel.bindContext("/" + sActionName + "(...)");
            oAction.setParameter("employeeId", sEmployeeId);
            
            oAction.execute().then(function () {
                that.getView().setBusy(false);
                var sResult = oAction.getBoundContext().getProperty("value");
                
                MessageBox.information("AI Analysis for " + sEmployeeName + ":\n\n" + sResult, {
                    styleClass: "sapUiSizeCompact",
                    contentWidth: "30rem"
                });
                
                // Refresh the view to show any new data
                that.getView().getElementBinding().refresh();
                
            }).catch(function (oError) {
                that.getView().setBusy(false);
                MessageBox.error("Error generating insights: " + (oError.message || "Unknown error"));
            });
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        }
    });
});
