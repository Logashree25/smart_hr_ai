sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "smart/hr/portal/model/formatter"
], function (Controller, MessageToast, MessageBox, Fragment, JSONModel, formatter) {
    "use strict";

    return Controller.extend("smart.hr.portal.controller.Dashboard", {

        formatter: formatter,

        /**
         * Called when the controller is instantiated.
         * Sets up data binding and loads dashboard KPIs.
         * Fetches summary KPIs from hrService on initialization.
         */
        onInit: function () {
            // Get router and attach route matched handler
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("RouteDashboard").attachPatternMatched(this._onRouteMatched, this);

            // Initialize models
            this._initializeModels();

            // Fetch summary KPIs from hrService immediately
            this._fetchSummaryKPIs();
        },

        /**
         * Initialize local models for dashboard data
         * @private
         */
        _initializeModels: function () {
            // Get the dashboard model that was already created by models.js
            var oDashboardModel = this.getView().getModel("dashboard");

            if (!oDashboardModel) {
                console.error("Dashboard model not found! Creating fallback model.");
                // Fallback: create dashboard model if not found
                oDashboardModel = new JSONModel({
                    // KPI Values with loading state
                    satisfactionScore: "Loading...",
                    satisfactionColor: "Neutral",
                    satisfactionTrend: "None",
                    attritionRiskPercent: "Loading...",
                    attritionColor: "Neutral",
                    attritionTrend: "None",
                    openRolesCount: "Loading...",
                    openRolesColor: "Neutral",
                    openRolesTrend: "None",
                    totalEmployees: "Loading...",
                    employeeTrend: "None",
                    lastUpdated: new Date()
                });
                this.getView().setModel(oDashboardModel, "dashboard");
            } else {
                // Update existing dashboard model with KPI structure
                oDashboardModel.setProperty("/satisfactionScore", "Loading...");
                oDashboardModel.setProperty("/satisfactionColor", "Neutral");
                oDashboardModel.setProperty("/satisfactionTrend", "None");
                oDashboardModel.setProperty("/attritionRiskPercent", "Loading...");
                oDashboardModel.setProperty("/attritionColor", "Neutral");
                oDashboardModel.setProperty("/attritionTrend", "None");
                oDashboardModel.setProperty("/openRolesCount", "Loading...");
                oDashboardModel.setProperty("/openRolesColor", "Neutral");
                oDashboardModel.setProperty("/openRolesTrend", "None");
                oDashboardModel.setProperty("/totalEmployees", "Loading...");
                oDashboardModel.setProperty("/employeeTrend", "None");
                oDashboardModel.setProperty("/lastUpdated", new Date());
            }

            // Initialize AI insights model with sample data
            this._initializeAIInsights();

            // Set some initial values for testing
            oDashboardModel.setProperty("/satisfactionScore", "8.5");
            oDashboardModel.setProperty("/totalEmployees", "1,247");
            oDashboardModel.setProperty("/attritionRiskPercent", "12");
        },

        /**
         * Fetch summary KPIs from hrService
         * @private
         */
        _fetchSummaryKPIs: function () {
            var oModel = this.getView().getModel(); // HR Service model
            var oDashboardModel = this.getView().getModel("dashboard");
            var that = this;

            console.log("Fetching summary KPIs from hrService...");

            // Fetch all KPIs in parallel
            Promise.all([
                this._fetchAverageSatisfaction(oModel),
                this._fetchAggregatedAttritionRisk(oModel),
                this._fetchOpenPositionsCount(oModel),
                this._fetchTotalEmployeesCount(oModel)
            ]).then(function (aResults) {
                // Update dashboard model with fetched data
                oDashboardModel.setData({
                    satisfactionScore: aResults[0].value,
                    satisfactionColor: aResults[0].color,
                    satisfactionTrend: aResults[0].trend,
                    attritionRiskPercent: aResults[1].value,
                    attritionColor: aResults[1].color,
                    attritionTrend: aResults[1].trend,
                    openRolesCount: aResults[2].value,
                    openRolesColor: aResults[2].color,
                    openRolesTrend: aResults[2].trend,
                    totalEmployees: aResults[3].value,
                    employeeTrend: aResults[3].trend,
                    lastUpdated: new Date()
                });

                console.log("Dashboard KPIs updated successfully");
            }).catch(function (oError) {
                console.error("Error fetching summary KPIs:", oError);

                // Set error state
                oDashboardModel.setData({
                    satisfactionScore: "Error",
                    satisfactionColor: "Error",
                    attritionRiskPercent: "Error",
                    attritionColor: "Error",
                    openRolesCount: "Error",
                    openRolesColor: "Error",
                    totalEmployees: "Error",
                    lastUpdated: new Date()
                });

                MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("errorLoadingDashboard"));
            });
        },

        /**
         * Route matched handler
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            // Refresh dashboard data when route is matched
            this._fetchSummaryKPIs();
        },

        /**
         * Fetch average satisfaction from hrService
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - HR Service model
         * @returns {Promise} Promise resolving to satisfaction KPI data
         * @private
         */
        _fetchAverageSatisfaction: function (oModel) {
            return new Promise(function (resolve, reject) {
                var oBinding = oModel.bindList("/SatisfactionSurvey");

                oBinding.requestContexts().then(function (aContexts) {
                    if (aContexts.length > 0) {
                        var iTotalScore = 0;
                        aContexts.forEach(function (oContext) {
                            iTotalScore += oContext.getProperty("Score");
                        });
                        var iAverage = Math.round(iTotalScore / aContexts.length);

                        // Determine color and trend based on satisfaction score
                        var sColor = iAverage >= 80 ? "Good" : iAverage >= 60 ? "Critical" : "Error";
                        var sTrend = iAverage >= 75 ? "Up" : "Down";

                        resolve({
                            value: iAverage,
                            color: sColor,
                            trend: sTrend
                        });
                    } else {
                        resolve({
                            value: "N/A",
                            color: "Neutral",
                            trend: "None"
                        });
                    }
                }).catch(function (oError) {
                    console.error("Error fetching satisfaction data:", oError);
                    reject(oError);
                });
            });
        },

        /**
         * Fetch aggregated attrition risk from hrService
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - HR Service model
         * @returns {Promise} Promise resolving to attrition risk KPI data
         * @private
         */
        _fetchAggregatedAttritionRisk: function (oModel) {
            return new Promise(function (resolve, reject) {
                var oBinding = oModel.bindList("/AttritionRisk");

                oBinding.requestContexts().then(function (aContexts) {
                    if (aContexts.length > 0) {
                        var iHighRiskCount = 0;
                        aContexts.forEach(function (oContext) {
                            var fRiskScore = oContext.getProperty("RiskScore");
                            if (fRiskScore > 0.7) {
                                iHighRiskCount++;
                            }
                        });

                        var fRiskPercent = Math.round((iHighRiskCount / aContexts.length) * 100);

                        // Determine color and trend based on risk percentage
                        var sColor = fRiskPercent <= 10 ? "Good" : fRiskPercent <= 25 ? "Critical" : "Error";
                        var sTrend = fRiskPercent <= 15 ? "Down" : "Up";

                        resolve({
                            value: fRiskPercent + "%",
                            color: sColor,
                            trend: sTrend
                        });
                    } else {
                        resolve({
                            value: "N/A",
                            color: "Neutral",
                            trend: "None"
                        });
                    }
                }).catch(function (oError) {
                    console.error("Error fetching attrition risk data:", oError);
                    reject(oError);
                });
            });
        },

        /**
         * Fetch open positions count from hrService
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - HR Service model
         * @returns {Promise} Promise resolving to open positions KPI data
         * @private
         */
        _fetchOpenPositionsCount: function (oModel) {
            return new Promise(function (resolve, reject) {
                var oBinding = oModel.bindList("/OpenPositions", null, null,
                    new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "open"));

                oBinding.requestContexts().then(function (aContexts) {
                    var iOpenCount = aContexts.length;

                    // Determine color and trend based on open positions count
                    var sColor = iOpenCount <= 5 ? "Good" : iOpenCount <= 10 ? "Critical" : "Error";
                    var sTrend = iOpenCount <= 3 ? "Down" : "Up";

                    resolve({
                        value: iOpenCount,
                        color: sColor,
                        trend: sTrend
                    });
                }).catch(function (oError) {
                    console.error("Error fetching open positions data:", oError);
                    reject(oError);
                });
            });
        },

        /**
         * Fetch total employees count from hrService
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - HR Service model
         * @returns {Promise} Promise resolving to total employees KPI data
         * @private
         */
        _fetchTotalEmployeesCount: function (oModel) {
            return new Promise(function (resolve, reject) {
                var oBinding = oModel.bindList("/Employees");

                oBinding.requestContexts(0, 1).then(function (aContexts) {
                    oBinding.getLength().then(function (iLength) {
                        resolve({
                            value: iLength,
                            color: "Good", // Always positive
                            trend: "Up" // Assume growth
                        });
                    });
                }).catch(function (oError) {
                    console.error("Error fetching total employees data:", oError);
                    reject(oError);
                });
            });
        },

        /**
         * Load dashboard KPI data
         * @private
         */
        _loadDashboardData: function () {
            var oModel = this.getView().getModel();
            var oDashboardModel = this.getView().getModel("dashboard");
            var oAIInsightsModel = this.getView().getModel("aiInsights");

            // Set initial loading state for KPI tiles
            oDashboardModel.setData({
                // KPI Values
                satisfactionScore: "...",
                satisfactionColor: "Neutral",
                satisfactionTrend: "None",
                attritionRiskPercent: "...",
                attritionColor: "Neutral",
                attritionTrend: "None",
                openRolesCount: "...",
                openRolesColor: "Neutral",
                openRolesTrend: "None",
                totalEmployees: "...",
                employeeTrend: "None"
            });

            // Initialize AI insights with sample data
            this._initializeAIInsights(oAIInsightsModel);

            // Load KPI data from OData services
            this._loadSatisfactionKPI(oDashboardModel);
            this._loadAttritionKPI(oDashboardModel);
            this._loadOpenRolesKPI(oDashboardModel);
            this._loadTotalEmployeesKPI(oDashboardModel);
        },

        /**
         * Initialize AI insights with sample data
         * @param {sap.ui.model.json.JSONModel} oAIInsightsModel - AI insights model
         * @private
         */
        _initializeAIInsights: function (oAIInsightsModel) {
            var oSampleData = {
                engagementIdeas: [
                    {
                        title: "Team Building Activities",
                        description: "Organize monthly cross-department team building events to improve collaboration",
                        impact: "High"
                    },
                    {
                        title: "Flexible Work Hours",
                        description: "Implement flexible working hours to improve work-life balance",
                        impact: "Medium"
                    },
                    {
                        title: "Recognition Program",
                        description: "Launch peer-to-peer recognition program to boost morale",
                        impact: "High"
                    }
                ],
                policyRecommendations: [
                    {
                        title: "Remote Work Policy",
                        description: "Update remote work policy to include hybrid options",
                        priority: "High"
                    },
                    {
                        title: "Performance Review Process",
                        description: "Streamline quarterly performance review process",
                        priority: "Medium"
                    }
                ],
                hiringInsights: [
                    {
                        title: "Engineering Shortage",
                        description: "Critical need for 3 senior developers in Q1",
                        urgency: "High"
                    },
                    {
                        title: "Sales Expansion",
                        description: "Plan for 2 additional sales representatives",
                        urgency: "Medium"
                    }
                ]
            };

            oAIInsightsModel.setData(oSampleData);
        },

        /**
         * Load satisfaction KPI
         * @param {sap.ui.model.json.JSONModel} oDashboardModel - Dashboard model
         * @private
         */
        _loadSatisfactionKPI: function (oDashboardModel) {
            var oModel = this.getView().getModel();
            var oBinding = oModel.bindList("/SatisfactionSurvey");

            oBinding.requestContexts().then(function (aContexts) {
                if (aContexts.length > 0) {
                    var iTotalScore = 0;
                    aContexts.forEach(function (oContext) {
                        iTotalScore += oContext.getProperty("Score");
                    });
                    var iAverage = Math.round(iTotalScore / aContexts.length);

                    // Set KPI value and color based on score
                    oDashboardModel.setProperty("/satisfactionScore", iAverage);
                    oDashboardModel.setProperty("/satisfactionColor", iAverage >= 80 ? "Good" : iAverage >= 60 ? "Critical" : "Error");
                    oDashboardModel.setProperty("/satisfactionTrend", iAverage >= 75 ? "Up" : "Down");
                } else {
                    oDashboardModel.setProperty("/satisfactionScore", "N/A");
                    oDashboardModel.setProperty("/satisfactionColor", "Neutral");
                }
            }).catch(function (oError) {
                console.error("Error loading satisfaction KPI:", oError);
                oDashboardModel.setProperty("/satisfactionScore", "Error");
                oDashboardModel.setProperty("/satisfactionColor", "Error");
            });
        },

        /**
         * Load attrition risk KPI
         * @param {sap.ui.model.json.JSONModel} oDashboardModel - Dashboard model
         * @private
         */
        _loadAttritionKPI: function (oDashboardModel) {
            var oModel = this.getView().getModel();
            var oBinding = oModel.bindList("/AttritionRisk");

            oBinding.requestContexts().then(function (aContexts) {
                if (aContexts.length > 0) {
                    var iHighRiskCount = 0;
                    aContexts.forEach(function (oContext) {
                        var fRiskScore = oContext.getProperty("RiskScore");
                        if (fRiskScore > 0.7) {
                            iHighRiskCount++;
                        }
                    });

                    var fRiskPercent = Math.round((iHighRiskCount / aContexts.length) * 100);

                    // Set KPI value and color based on risk percentage
                    oDashboardModel.setProperty("/attritionRiskPercent", fRiskPercent + "%");
                    oDashboardModel.setProperty("/attritionColor", fRiskPercent <= 10 ? "Good" : fRiskPercent <= 25 ? "Critical" : "Error");
                    oDashboardModel.setProperty("/attritionTrend", fRiskPercent <= 15 ? "Down" : "Up");
                } else {
                    oDashboardModel.setProperty("/attritionRiskPercent", "N/A");
                    oDashboardModel.setProperty("/attritionColor", "Neutral");
                }
            }).catch(function (oError) {
                console.error("Error loading attrition KPI:", oError);
                oDashboardModel.setProperty("/attritionRiskPercent", "Error");
                oDashboardModel.setProperty("/attritionColor", "Error");
            });
        },

        /**
         * Load open roles KPI
         * @param {sap.ui.model.json.JSONModel} oDashboardModel - Dashboard model
         * @private
         */
        _loadOpenRolesKPI: function (oDashboardModel) {
            var oModel = this.getView().getModel();
            var oBinding = oModel.bindList("/OpenPositions", null, null,
                new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "open"));

            oBinding.requestContexts().then(function (aContexts) {
                var iOpenCount = aContexts.length;

                // Set KPI value and color based on open positions count
                oDashboardModel.setProperty("/openRolesCount", iOpenCount);
                oDashboardModel.setProperty("/openRolesColor", iOpenCount <= 5 ? "Good" : iOpenCount <= 10 ? "Critical" : "Error");
                oDashboardModel.setProperty("/openRolesTrend", iOpenCount <= 3 ? "Down" : "Up");
            }).catch(function (oError) {
                console.error("Error loading open roles KPI:", oError);
                oDashboardModel.setProperty("/openRolesCount", "Error");
                oDashboardModel.setProperty("/openRolesColor", "Error");
            });
        },

        /**
         * Load total employees KPI
         * @param {sap.ui.model.json.JSONModel} oDashboardModel - Dashboard model
         * @private
         */
        _loadTotalEmployeesKPI: function (oDashboardModel) {
            var oModel = this.getView().getModel();
            var oBinding = oModel.bindList("/Employees");

            oBinding.requestContexts(0, 1).then(function (aContexts) {
                // Get total count from binding
                oBinding.getLength().then(function (iLength) {
                    oDashboardModel.setProperty("/totalEmployees", iLength);
                    oDashboardModel.setProperty("/employeeTrend", "Up"); // Assume growth
                });
            }).catch(function (oError) {
                console.error("Error loading total employees KPI:", oError);
                oDashboardModel.setProperty("/totalEmployees", "Error");
            });
        },

        /**
         * Handle satisfaction tile press
         */
        onSatisfactionTilePress: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("navigatingToSatisfactionDetails"));
            // TODO: Navigate to satisfaction details view
        },

        /**
         * Handle attrition tile press
         */
        onAttritionTilePress: function () {
            // Navigate to attrition monitor view
            this.oRouter.navTo("RouteAttritionMonitor");
        },

        /**
         * Handle open roles tile press
         */
        onOpenRolesTilePress: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("navigatingToOpenRoles"));
            // TODO: Navigate to open positions view
        },

        /**
         * Handle total employees tile press
         */
        onTotalEmployeesTilePress: function () {
            // Navigate to employee list view
            this.oRouter.navTo("RouteEmployeeList");
        },

        /**
         * Handle engagement idea press
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onEngagementIdeaPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("aiInsights");
            var sTitle = oContext.getProperty("title");
            var sDescription = oContext.getProperty("description");

            MessageBox.information(sDescription, {
                title: sTitle
            });
        },

        /**
         * Handle policy recommendation press
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onPolicyRecommendationPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("aiInsights");
            var sTitle = oContext.getProperty("title");
            var sDescription = oContext.getProperty("description");

            MessageBox.information(sDescription, {
                title: sTitle
            });
        },

        /**
         * Handle hiring insight press
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onHiringInsightPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("aiInsights");
            var sTitle = oContext.getProperty("title");
            var sDescription = oContext.getProperty("description");

            MessageBox.information(sDescription, {
                title: sTitle
            });
        },

        /**
         * Generate engagement ideas using AI
         */
        onGenerateEngagementIdeas: function () {
            var oGenAIModel = this.getView().getModel("genai");
            var that = this;
            
            // Show loading message
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("generatingIdeas"));
            
            // Call GenAI service action
            var oAction = oGenAIModel.bindContext("/getEngagementIdeas(...)");
            oAction.setParameter("department", "Engineering");
            oAction.setParameter("recentTrends", "Low satisfaction in recent surveys");
            
            oAction.execute().then(function () {
                var sResult = oAction.getBoundContext().getProperty("ideas");
                MessageBox.information(sResult, {
                    title: that.getView().getModel("i18n").getResourceBundle().getText("engagementIdeas")
                });
            }).catch(function (oError) {
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("errorGeneratingIdeas"));
                console.error("Error generating engagement ideas:", oError);
            });
        },

        /**
         * Analyze policy gaps using AI
         */
        onAnalyzePolicyGaps: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Prioritize hiring using AI
         */
        onPrioritizeHiring: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Navigate to detailed AI suggestions view
         */
        onViewDetailedAISuggestions: function () {
            this.oRouter.navTo("RouteAISuggestions");
        },

        /**
         * Handle insight press
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onInsightPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("genai");
            var sInsightText = oContext.getProperty("IdeaText");
            
            MessageBox.information(sInsightText, {
                title: this.getView().getModel("i18n").getResourceBundle().getText("insightDetails")
            });
        },

        /**
         * View open roles
         */
        onViewOpenRoles: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("navigatingToOpenRoles"));
            // TODO: Navigate to open roles view
        },

        /**
         * Refresh dashboard data
         */
        onRefreshDashboard: function () {
            this._loadDashboardData();
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("dashboardRefreshed"));
        },

        /**
         * Navigate to analytics view
         */
        onViewAnalytics: function () {
            this.oRouter.navTo("RouteAnalytics");
        },

        /**
         * Generate AI insights
         */
        onGenerateAIInsights: function () {
            var oAISuggestionsModel = this.getView().getModel("aiSuggestions");

            console.log("Generating AI insights...");
            MessageToast.show("Generating AI insights...");

            // Set analyzing state
            if (oAISuggestionsModel) {
                oAISuggestionsModel.setProperty("/isAnalyzing", true);
                oAISuggestionsModel.setProperty("/aiStatus", "Analyzing...");

                // Simulate AI processing
                setTimeout(function () {
                    oAISuggestionsModel.setProperty("/isAnalyzing", false);
                    oAISuggestionsModel.setProperty("/aiStatus", "Ready");
                    oAISuggestionsModel.setProperty("/totalSuggestions", 5);
                    MessageToast.show("AI insights generated successfully!");
                }, 2000);
            }
        },

        /**
         * Handle employee press
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onEmployeePress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (oContext) {
                var sEmployeeId = oContext.getProperty("ID");
                console.log("Employee selected:", sEmployeeId);

                // Navigate to employee detail
                this.oRouter.navTo("RouteEmployeeDetail", {
                    employeeId: sEmployeeId
                });
            }
        }
    });
});
