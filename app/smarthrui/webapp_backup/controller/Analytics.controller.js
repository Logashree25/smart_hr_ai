sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("smart.hr.portal.controller.Analytics", {

        /**
         * Called when the controller is instantiated.
         */
        onInit: function () {
            // Get router and attach route matched handler
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("RouteAnalytics").attachPatternMatched(this._onRouteMatched, this);
            
            // Initialize analytics model
            this._initializeAnalyticsModel();
        },

        /**
         * Route matched handler
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            // Load analytics data when route is matched
            this._loadAnalyticsData();
        },

        /**
         * Initialize analytics model
         * @private
         */
        _initializeAnalyticsModel: function () {
            var oAnalyticsModel = new JSONModel({
                selectedDepartment: "",
                dateRange: "",
                departmentStats: [],
                insights: [],
                loading: false
            });
            
            this.getView().setModel(oAnalyticsModel, "analytics");
        },

        /**
         * Load analytics data
         * @private
         */
        _loadAnalyticsData: function () {
            var oAnalyticsModel = this.getView().getModel("analytics");
            oAnalyticsModel.setProperty("/loading", true);
            
            // Load department statistics
            this._loadDepartmentStats();
            
            // Load insights
            this._loadInsights();
            
            oAnalyticsModel.setProperty("/loading", false);
        },

        /**
         * Load department statistics
         * @private
         */
        _loadDepartmentStats: function () {
            var oModel = this.getView().getModel();
            var oAnalyticsModel = this.getView().getModel("analytics");
            var that = this;
            
            // Get all employees with their data
            var oBinding = oModel.bindList("/Employees", null, null, null, {
                $expand: "SurveyResponses,PerformanceMetrics,AttritionRisk"
            });
            
            oBinding.requestContexts().then(function (aContexts) {
                var aDepartmentStats = that._calculateDepartmentStats(aContexts);
                oAnalyticsModel.setProperty("/departmentStats", aDepartmentStats);
            }).catch(function (oError) {
                console.error("Error loading department stats:", oError);
                MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("errorLoadingData"));
            });
        },

        /**
         * Calculate department statistics
         * @param {Array} aContexts - Employee contexts
         * @returns {Array} Department statistics
         * @private
         */
        _calculateDepartmentStats: function (aContexts) {
            var oDepartments = {};
            
            // Group employees by department
            aContexts.forEach(function (oContext) {
                var oEmployee = oContext.getObject();
                var sDepartment = oEmployee.Department;
                
                if (!oDepartments[sDepartment]) {
                    oDepartments[sDepartment] = {
                        department: sDepartment,
                        employees: [],
                        satisfactionScores: [],
                        performanceScores: [],
                        riskScores: []
                    };
                }
                
                oDepartments[sDepartment].employees.push(oEmployee);
                
                // Collect satisfaction scores
                if (oEmployee.SurveyResponses) {
                    oEmployee.SurveyResponses.forEach(function (oSurvey) {
                        oDepartments[sDepartment].satisfactionScores.push(oSurvey.Score);
                    });
                }
                
                // Collect performance scores
                if (oEmployee.PerformanceMetrics) {
                    oEmployee.PerformanceMetrics.forEach(function (oMetric) {
                        oDepartments[sDepartment].performanceScores.push(oMetric.ObjectiveCompletionRate);
                    });
                }
                
                // Collect risk scores
                if (oEmployee.AttritionRisk) {
                    oDepartments[sDepartment].riskScores.push(oEmployee.AttritionRisk.RiskScore);
                }
            });
            
            // Calculate averages and format data
            var aStats = [];
            Object.keys(oDepartments).forEach(function (sDepartment) {
                var oDept = oDepartments[sDepartment];
                var iAvgSatisfaction = oDept.satisfactionScores.length > 0 ? 
                    Math.round(oDept.satisfactionScores.reduce(function (a, b) { return a + b; }, 0) / oDept.satisfactionScores.length) : 0;
                var iAvgPerformance = oDept.performanceScores.length > 0 ? 
                    Math.round(oDept.performanceScores.reduce(function (a, b) { return a + b; }, 0) / oDept.performanceScores.length) : 0;
                var fAvgRisk = oDept.riskScores.length > 0 ? 
                    (oDept.riskScores.reduce(function (a, b) { return a + b; }, 0) / oDept.riskScores.length).toFixed(2) : 0;
                
                var sRiskLevel = fAvgRisk > 0.7 ? "High" : fAvgRisk > 0.4 ? "Medium" : "Low";
                var sRiskState = fAvgRisk > 0.7 ? "Error" : fAvgRisk > 0.4 ? "Warning" : "Success";
                
                aStats.push({
                    department: sDepartment,
                    employeeCount: oDept.employees.length,
                    avgSatisfaction: iAvgSatisfaction,
                    avgPerformance: iAvgPerformance,
                    avgRisk: fAvgRisk,
                    riskLevel: sRiskLevel,
                    riskState: sRiskState
                });
            });
            
            return aStats;
        },

        /**
         * Load insights from GenAI service
         * @private
         */
        _loadInsights: function () {
            var oAnalyticsModel = this.getView().getModel("analytics");
            
            // Set sample insights for now
            var aInsights = [
                {
                    title: "Engineering Department Satisfaction Declining",
                    description: "Average satisfaction in Engineering has dropped 15% over the last quarter",
                    confidence: "High",
                    type: "trend"
                },
                {
                    title: "Sales Team Performance Improving",
                    description: "Sales team objective completion rate increased by 12% this month",
                    confidence: "High",
                    type: "performance"
                }
            ];
            
            oAnalyticsModel.setProperty("/insights", aInsights);
        },

        /**
         * Handle department filter change
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onDepartmentFilterChange: function (oEvent) {
            var sSelectedDepartment = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("analytics").setProperty("/selectedDepartment", sSelectedDepartment);
        },

        /**
         * Handle date range change
         * @param {sap.ui.base.Event} oEvent - Change event
         */
        onDateRangeChange: function (oEvent) {
            var sDateRange = oEvent.getParameter("value");
            this.getView().getModel("analytics").setProperty("/dateRange", sDateRange);
        },

        /**
         * Apply filters
         */
        onApplyFilters: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("filtersApplied"));
            this._loadAnalyticsData();
        },

        /**
         * Reset filters
         */
        onResetFilters: function () {
            var oAnalyticsModel = this.getView().getModel("analytics");
            oAnalyticsModel.setProperty("/selectedDepartment", "");
            oAnalyticsModel.setProperty("/dateRange", "");
            
            this.byId("departmentFilter").setSelectedKey("");
            this.byId("dateRangeFilter").setValue("");
            
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("filtersReset"));
            this._loadAnalyticsData();
        },

        /**
         * View satisfaction chart
         */
        onViewSatisfactionChart: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * View performance chart
         */
        onViewPerformanceChart: function () {
            // Navigate to performance analytics view
            this.oRouter.navTo("RoutePerformanceAnalytics");
        },

        /**
         * Generate department insights using AI
         */
        onGenerateDepartmentInsights: function () {
            var oGenAIModel = this.getView().getModel("genai");
            var that = this;
            
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("generatingInsights"));
            
            // Call GenAI service action
            var oAction = oGenAIModel.bindContext("/getEngagementIdeas(...)");
            oAction.setParameter("department", "All Departments");
            oAction.setParameter("recentTrends", "Analytics data trends");
            
            oAction.execute().then(function () {
                var sResult = oAction.getBoundContext().getProperty("ideas");
                MessageBox.information(sResult, {
                    title: that.getView().getModel("i18n").getResourceBundle().getText("departmentInsights")
                });
            }).catch(function (oError) {
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("errorGeneratingInsights"));
                console.error("Error generating insights:", oError);
            });
        },

        /**
         * Analyze trends using AI
         */
        onAnalyzeTrends: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Predict attrition using AI
         */
        onPredictAttrition: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Handle insight press
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onInsightPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("analytics");
            var sTitle = oContext.getProperty("title");
            var sDescription = oContext.getProperty("description");
            
            MessageBox.information(sDescription, {
                title: sTitle
            });
        },

        /**
         * View employee from attrition table
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onViewEmployeeFromAttrition: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oContext.getProperty("EmployeeID/ID");
            
            this.oRouter.navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        /**
         * Format urgency state
         * @param {string} sUrgency - Urgency level
         * @returns {string} State
         */
        formatUrgencyState: function (sUrgency) {
            switch (sUrgency) {
                case "High":
                    return "Error";
                case "Medium":
                    return "Warning";
                case "Low":
                    return "Success";
                default:
                    return "None";
            }
        },

        /**
         * Export analytics data
         */
        onExportData: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Refresh analytics data
         */
        onRefreshAnalytics: function () {
            this._loadAnalyticsData();
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("analyticsRefreshed"));
        }
    });
});
