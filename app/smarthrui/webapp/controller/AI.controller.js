sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("smarthrui.controller.AI", {

        onInit: function () {
            this.getRouter().getRoute("RouteAI").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function () {
            this._refreshAllTables();
        },

        _refreshAllTables: function () {
            // Refresh all AI-generated data tables
            var aTables = [
                "engagementIdeasTable",
                "policyEnhancementsTable"
            ];
            
            aTables.forEach(function (sTableId) {
                var oTable = this.byId(sTableId);
                if (oTable && oTable.getBinding("items")) {
                    oTable.getBinding("items").refresh();
                }
            }.bind(this));
        },

        onGenerateEngagementIdeas: function () {
            var oViewModel = this.getView().getModel("view");
            var sDepartment = oViewModel.getProperty("/selectedDepartment");
            
            if (!sDepartment) {
                MessageBox.warning("Please select a department first.");
                return;
            }
            
            this._callAIAction("generateEngagementIdeas", { department: sDepartment }, "Engagement Ideas for " + sDepartment);
        },

        onAnalyzePolicyGaps: function () {
            this._callAIAction("analyzePolicyGaps", {}, "Policy Gap Analysis");
        },

        onAnalyzeTeamPerformance: function () {
            var oViewModel = this.getView().getModel("view");
            var sDepartment = oViewModel.getProperty("/selectedDepartment");
            
            if (!sDepartment) {
                MessageBox.warning("Please select a department first.");
                return;
            }
            
            this._callAIAction("analyzeTeamPerformance", { department: sDepartment }, "Team Performance Analysis for " + sDepartment);
        },

        _callAIAction: function (sActionName, oParameters, sTitle) {
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            
            MessageBox.confirm("Generate " + sTitle + "?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._executeAIAction(sActionName, oParameters, sTitle);
                    }
                }
            });
        },

        _executeAIAction: function (sActionName, oParameters, sTitle) {
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            
            // Show loading
            this.getView().setBusy(true);
            
            var oAction = oModel.bindContext("/" + sActionName + "(...)");
            
            // Set parameters
            Object.keys(oParameters).forEach(function (sKey) {
                oAction.setParameter(sKey, oParameters[sKey]);
            });
            
            oAction.execute().then(function () {
                that.getView().setBusy(false);
                var sResult = oAction.getBoundContext().getProperty("value");
                
                MessageBox.information(sTitle + ":\n\n" + sResult, {
                    styleClass: "sapUiSizeCompact",
                    contentWidth: "40rem"
                });
                
                // Refresh the relevant tables to show new data
                that._refreshAllTables();
                
            }).catch(function (oError) {
                that.getView().setBusy(false);
                MessageBox.error("Error generating insights: " + (oError.message || "Unknown error"));
            });
        },

        onRefreshEngagementIdeas: function () {
            this.byId("engagementIdeasTable").getBinding("items").refresh();
            MessageToast.show("Engagement ideas refreshed");
        },



        onRefreshPolicyEnhancements: function () {
            this.byId("policyEnhancementsTable").getBinding("items").refresh();
            MessageToast.show("Policy enhancements refreshed");
        },



        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        }
    });
});
