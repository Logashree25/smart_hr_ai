sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("smart.hr.portal.controller.App", {

        /**
         * Called when the controller is instantiated.
         * Sets up the router and initializes the application.
         */
        onInit: function () {
            // Get the router instance (router is already initialized in Component.js)
            this.oRouter = this.getOwnerComponent().getRouter();

            console.log("App controller initialized");

            // Set up route matched handlers for navigation state
            this.oRouter.getRoute("RouteDashboard").attachPatternMatched(this._onRouteMatched, this);

            // Check if other routes exist before attaching handlers
            var oAnalyticsRoute = this.oRouter.getRoute("RouteAnalytics");
            if (oAnalyticsRoute) {
                oAnalyticsRoute.attachPatternMatched(this._onRouteMatched, this);
            }

            this.oRouter.getRoute("RouteEmployeeDetail").attachPatternMatched(this._onRouteMatched, this);
            this.oRouter.getRoute("RouteEmployeeList").attachPatternMatched(this._onRouteMatched, this);
            this.oRouter.getRoute("RouteAttritionMonitor").attachPatternMatched(this._onRouteMatched, this);
            this.oRouter.getRoute("RoutePerformanceAnalytics").attachPatternMatched(this._onRouteMatched, this);
            this.oRouter.getRoute("RouteHiringNeeds").attachPatternMatched(this._onRouteMatched, this);
            this.oRouter.getRoute("RouteAISuggestions").attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * Route matched handler to update navigation state
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oSegmentedButton = this.byId("navSegmentedButton");
            
            // Update navigation button selection based on current route
            switch (sRouteName) {
                case "RouteDashboard":
                    oSegmentedButton.setSelectedKey("dashboard");
                    break;
                case "RouteAnalytics":
                    oSegmentedButton.setSelectedKey("analytics");
                    break;
                case "RoutePerformanceAnalytics":
                    oSegmentedButton.setSelectedKey("analytics"); // Performance analytics is part of analytics
                    break;
                case "RouteEmployeeList":
                    oSegmentedButton.setSelectedKey("dashboard"); // Keep dashboard selected for employee list
                    break;
                case "RouteAttritionMonitor":
                    oSegmentedButton.setSelectedKey("dashboard"); // Keep dashboard selected for attrition monitor
                    break;
                case "RouteHiringNeeds":
                    oSegmentedButton.setSelectedKey("dashboard"); // Keep dashboard selected for hiring needs
                    break;
                case "RouteAISuggestions":
                    oSegmentedButton.setSelectedKey("dashboard"); // Keep dashboard selected for AI suggestions
                    break;
                default:
                    oSegmentedButton.setSelectedKey("dashboard");
            }
        },

        /**
         * Navigate to Dashboard
         */
        onNavToDashboard: function () {
            this.oRouter.navTo("RouteDashboard");
        },

        /**
         * Navigate to Analytics
         */
        onNavToAnalytics: function () {
            this.oRouter.navTo("RouteAnalytics");
        },

        /**
         * Refresh the current view and reload data
         */
        onRefresh: function () {
            // Get the current view's model and refresh
            var oModel = this.getView().getModel();
            if (oModel) {
                oModel.refresh();
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("dataRefreshed"));
            }
            
            // Also refresh the GenAI model
            var oGenAIModel = this.getView().getModel("genai");
            if (oGenAIModel) {
                oGenAIModel.refresh();
            }
        },

        /**
         * Open settings dialog
         */
        onSettings: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("settingsNotImplemented"));
        },

        /**
         * Get the router instance
         * @returns {sap.ui.core.routing.Router} Router instance
         */
        getRouter: function () {
            return this.oRouter;
        }
    });
});
