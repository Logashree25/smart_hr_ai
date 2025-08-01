sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("smart.hr.portal.controller.EmployeeDetail", {

        /**
         * Called when the controller is instantiated.
         */
        onInit: function () {
            // Get router and attach route matched handler
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("RouteEmployeeDetail").attachPatternMatched(this._onRouteMatched, this);

            // Initialize local models for employee detail data
            this._initializeDetailModels();
        },

        /**
         * Initialize local models for employee detail
         * @private
         */
        _initializeDetailModels: function () {
            // Create employee detail model for AI-generated content
            var oEmployeeDetailModel = new sap.ui.model.json.JSONModel({
                attritionExplanation: "Click 'Explain Risk' to generate AI explanation...",
                feedbackSummary: "Click 'Summarize Feedback' to generate AI summary...",
                isLoadingExplanation: false,
                isLoadingSummary: false
            });

            this.getView().setModel(oEmployeeDetailModel, "employeeDetail");
        },

        /**
         * Route matched handler
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            var sEmployeeId = oEvent.getParameter("arguments").employeeId;

            // Store employee ID for later use
            this._sCurrentEmployeeId = sEmployeeId;

            // Reset AI content
            this._resetAIContent();

            // Load employee data by ID
            this._loadEmployeeById(sEmployeeId);
        },

        /**
         * Load employee data by ID from the Employees entity
         * @param {string} sEmployeeId - Employee ID
         * @private
         */
        _loadEmployeeById: function (sEmployeeId) {
            var oModel = this.getView().getModel(); // HR Service OData model
            var sPath = "/Employees(" + sEmployeeId + ")";
            var that = this;

            console.log("Loading employee by ID:", sEmployeeId);

            // Bind the view to the employee data with expanded navigation properties
            this.getView().bindElement({
                path: sPath,
                parameters: {
                    $expand: "PerformanceMetrics,SurveyResponses,FeedbackReceived,AttritionRisk,TrainingRecommendations"
                },
                events: {
                    dataRequested: function () {
                        that.getView().setBusy(true);
                        console.log("Employee data requested for ID:", sEmployeeId);
                    },
                    dataReceived: function (oEvent) {
                        that.getView().setBusy(false);
                        var oData = oEvent.getParameter("data");

                        if (oData) {
                            console.log("Employee data loaded successfully:", oData);
                            that._onEmployeeDataLoaded(oData);
                        } else {
                            console.error("No employee data received for ID:", sEmployeeId);
                            that._handleEmployeeNotFound();
                        }
                    },
                    change: function (oEvent) {
                        that.getView().setBusy(false);
                        var oContext = that.getView().getBindingContext();

                        if (oContext) {
                            var oData = oContext.getObject();
                            console.log("Employee context changed:", oData);
                            that._onEmployeeDataLoaded(oData);
                        }
                    }
                }
            });
        },

        /**
         * Handle successful employee data loading
         * @param {object} oEmployeeData - Employee data object
         * @private
         */
        _onEmployeeDataLoaded: function (oEmployeeData) {
            console.log("Employee data loaded for:", oEmployeeData.FirstName, oEmployeeData.LastName);

            // Update page title with employee name
            var sPageTitle = this.getView().getModel("i18n").getResourceBundle().getText("employeeDetails") +
                           " - " + oEmployeeData.FirstName + " " + oEmployeeData.LastName;
            this.byId("employeeDetailPage").setTitle(sPageTitle);

            // Auto-load AI insights if employee has risk data or feedback
            this._autoLoadAIInsights(oEmployeeData);
        },

        /**
         * Auto-load AI insights based on available data
         * @param {object} oEmployeeData - Employee data object
         * @private
         */
        _autoLoadAIInsights: function (oEmployeeData) {
            var sEmployeeId = oEmployeeData.ID;
            var oEmployeeDetailModel = this.getView().getModel("employeeDetail");

            // Check for cached AI results first
            var sCachedExplanation = this._loadCachedAIResult("attritionExplanation", sEmployeeId);
            var sCachedSummary = this._loadCachedAIResult("feedbackSummary", sEmployeeId);

            // Load cached explanation if available
            if (sCachedExplanation) {
                oEmployeeDetailModel.setProperty("/attritionExplanation", sCachedExplanation);
                this.byId("aiExplanationPanel").setExpanded(true);
                console.log("Loaded cached attrition explanation");
            }

            // Load cached summary if available
            if (sCachedSummary) {
                oEmployeeDetailModel.setProperty("/feedbackSummary", sCachedSummary);
                this.byId("aiSummaryPanel").setExpanded(true);
                console.log("Loaded cached feedback summary");
            }

            // Auto-explain attrition risk if risk score is high and no cached result
            if (!sCachedExplanation &&
                oEmployeeData.AttritionRisk &&
                oEmployeeData.AttritionRisk.RiskScore > 0.7 &&
                oEmployeeData.AttritionRisk.UrgencyLevel === "High") {

                console.log("High attrition risk detected, auto-generating explanation");
                setTimeout(function () {
                    this.onExplainAttritionRisk();
                }.bind(this), 1000);
            }

            // Auto-summarize feedback if there are recent feedback entries and no cached result
            if (!sCachedSummary &&
                oEmployeeData.FeedbackReceived &&
                oEmployeeData.FeedbackReceived.length > 3) {

                console.log("Multiple feedback entries found, auto-generating summary");
                setTimeout(function () {
                    this.onSummarizeFeedback();
                }.bind(this), 2000);
            }
        },

        /**
         * Handle employee not found scenario
         * @private
         */
        _handleEmployeeNotFound: function () {
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            sap.m.MessageBox.error(oResourceBundle.getText("employeeNotFound"), {
                title: oResourceBundle.getText("error"),
                onClose: function () {
                    this.onNavBack();
                }.bind(this)
            });
        },

        /**
         * Reset AI-generated content
         * @private
         */
        _resetAIContent: function () {
            var oEmployeeDetailModel = this.getView().getModel("employeeDetail");

            oEmployeeDetailModel.setProperty("/attritionExplanation", "Click 'Explain Risk' to generate AI explanation...");
            oEmployeeDetailModel.setProperty("/feedbackSummary", "Click 'Summarize Feedback' to generate AI summary...");
            oEmployeeDetailModel.setProperty("/isLoadingExplanation", false);
            oEmployeeDetailModel.setProperty("/isLoadingSummary", false);
        },

        /**
         * Navigate back to previous view
         */
        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.oRouter.navTo("RouteDashboard", {}, true);
            }
        },

        /**
         * Explain attrition risk using AI - Enhanced with proper binding
         */
        onExplainAttritionRisk: function () {
            var oContext = this.getView().getBindingContext();
            if (!oContext) {
                console.error("No binding context available for employee");
                return;
            }

            var sEmployeeId = oContext.getProperty("ID") || this._sCurrentEmployeeId;
            var oGenAIModel = this.getView().getModel("genai");
            var oEmployeeDetailModel = this.getView().getModel("employeeDetail");
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var that = this;

            console.log("Explaining attrition risk for employee ID:", sEmployeeId);

            // Set loading state and bind to view
            oEmployeeDetailModel.setProperty("/isLoadingExplanation", true);
            oEmployeeDetailModel.setProperty("/attritionExplanation", oResourceBundle.getText("generatingExplanation"));

            // Expand the explanation panel to show loading
            this.byId("aiExplanationPanel").setExpanded(true);

            // Show loading message
            sap.m.MessageToast.show(oResourceBundle.getText("generatingExplanation"));

            // Check if GenAI model is available
            if (!oGenAIModel) {
                console.warn("GenAI model not available, using fallback explanation");
                this._setFallbackAttritionExplanation();
                return;
            }

            try {
                // Call GenAI service action with proper parameter binding
                var oAction = oGenAIModel.bindContext("/explainAttritionRisk(...)");
                oAction.setParameter("employeeID", parseInt(sEmployeeId));

                // Execute the action and bind results to view
                oAction.execute().then(function () {
                    var oBoundContext = oAction.getBoundContext();
                    var sResult = oBoundContext.getProperty("explanation");

                    console.log("AI explanation generated successfully:", sResult);

                    // Bind the result to the view model
                    oEmployeeDetailModel.setProperty("/attritionExplanation", sResult);
                    oEmployeeDetailModel.setProperty("/isLoadingExplanation", false);

                    // Update view with success message
                    sap.m.MessageToast.show(oResourceBundle.getText("explanationGenerated"));

                    // Store the explanation for future reference
                    that._storeAIResult("attritionExplanation", sResult, sEmployeeId);

                }).catch(function (oError) {
                    console.error("Error calling explainAttritionRisk action:", oError);
                    that._setFallbackAttritionExplanation();
                });

            } catch (oError) {
                console.error("Error setting up explainAttritionRisk action:", oError);
                this._setFallbackAttritionExplanation();
            }
        },

        /**
         * Set fallback attrition explanation
         * @private
         */
        _setFallbackAttritionExplanation: function () {
            var oEmployeeDetailModel = this.getView().getModel("employeeDetail");
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var oContext = this.getView().getBindingContext();

            // Generate contextual fallback based on available data
            var sFallbackExplanation = this._generateContextualAttritionExplanation(oContext);

            oEmployeeDetailModel.setProperty("/attritionExplanation", sFallbackExplanation);
            oEmployeeDetailModel.setProperty("/isLoadingExplanation", false);

            sap.m.MessageToast.show(oResourceBundle.getText("usingFallbackExplanation"));
        },

        /**
         * Generate contextual attrition explanation based on employee data
         * @param {sap.ui.model.Context} oContext - Employee context
         * @returns {string} Contextual explanation
         * @private
         */
        _generateContextualAttritionExplanation: function (oContext) {
            if (!oContext) {
                return "Unable to generate explanation without employee data.";
            }

            var oEmployee = oContext.getObject();
            var aFactors = [];

            // Analyze risk factors based on available data
            if (oEmployee.AttritionRisk) {
                var fRiskScore = oEmployee.AttritionRisk.RiskScore;
                var sUrgencyLevel = oEmployee.AttritionRisk.UrgencyLevel;

                if (fRiskScore > 0.8) {
                    aFactors.push("very high risk score (" + Math.round(fRiskScore * 100) + "%)");
                } else if (fRiskScore > 0.6) {
                    aFactors.push("elevated risk score (" + Math.round(fRiskScore * 100) + "%)");
                }

                if (sUrgencyLevel === "High") {
                    aFactors.push("high urgency level requiring immediate attention");
                }
            }

            // Check performance trends
            if (oEmployee.PerformanceMetrics && oEmployee.PerformanceMetrics.length > 0) {
                var oLatestPerformance = oEmployee.PerformanceMetrics[oEmployee.PerformanceMetrics.length - 1];
                if (oLatestPerformance.ObjectiveCompletionRate < 70) {
                    aFactors.push("recent performance below expectations");
                }
            }

            // Check satisfaction levels
            if (oEmployee.SurveyResponses && oEmployee.SurveyResponses.length > 0) {
                var oLatestSurvey = oEmployee.SurveyResponses[oEmployee.SurveyResponses.length - 1];
                if (oLatestSurvey.Score < 60) {
                    aFactors.push("low satisfaction scores");
                }
            }

            // Check tenure
            if (oEmployee.TenureMonths < 12) {
                aFactors.push("short tenure (new employee risk)");
            } else if (oEmployee.TenureMonths > 60) {
                aFactors.push("long tenure (potential stagnation)");
            }

            // Generate explanation
            var sExplanation = "Based on the employee's profile, ";

            if (aFactors.length > 0) {
                sExplanation += "key risk factors include: " + aFactors.join(", ") + ". ";
                sExplanation += "Recommended actions: conduct one-on-one meetings, review career development opportunities, " +
                              "address any performance concerns, and implement targeted retention strategies.";
            } else {
                sExplanation += "the attrition risk appears to be within normal parameters. " +
                              "Continue regular check-ins and maintain current engagement strategies.";
            }

            return sExplanation;
        },

        /**
         * Generate training recommendations using AI
         */
        onGenerateTrainingRecommendations: function () {
            var oContext = this.getView().getBindingContext();
            var sEmployeeId = oContext.getProperty("ID");
            var oGenAIModel = this.getView().getModel("genai");
            var that = this;
            
            // Show loading message
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("generatingRecommendations"));
            
            // Call GenAI service action
            var oAction = oGenAIModel.bindContext("/suggestTraining(...)");
            oAction.setParameter("employeeID", parseInt(sEmployeeId));
            oAction.setParameter("gaps", "Performance improvement needed");
            
            oAction.execute().then(function () {
                var sResult = oAction.getBoundContext().getProperty("plan");
                MessageBox.information(sResult, {
                    title: that.getView().getModel("i18n").getResourceBundle().getText("trainingPlan")
                });
                
                // Refresh the training recommendations list
                that.getView().getModel().refresh();
            }).catch(function (oError) {
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("errorGeneratingRecommendations"));
                console.error("Error generating training recommendations:", oError);
            });
        },

        /**
         * Summarize feedback using AI - Enhanced with proper binding
         */
        onSummarizeFeedback: function () {
            var oContext = this.getView().getBindingContext();
            if (!oContext) {
                console.error("No binding context available for employee");
                return;
            }

            var sEmployeeId = oContext.getProperty("ID") || this._sCurrentEmployeeId;
            var oGenAIModel = this.getView().getModel("genai");
            var oEmployeeDetailModel = this.getView().getModel("employeeDetail");
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var that = this;

            console.log("Summarizing feedback for employee ID:", sEmployeeId);

            // Set loading state and bind to view
            oEmployeeDetailModel.setProperty("/isLoadingSummary", true);
            oEmployeeDetailModel.setProperty("/feedbackSummary", oResourceBundle.getText("summarizingFeedback"));

            // Expand the summary panel to show loading
            this.byId("aiSummaryPanel").setExpanded(true);

            // Show loading message
            sap.m.MessageToast.show(oResourceBundle.getText("summarizingFeedback"));

            // Check if GenAI model is available
            if (!oGenAIModel) {
                console.warn("GenAI model not available, using fallback summary");
                this._setFallbackFeedbackSummary();
                return;
            }

            try {
                // Call GenAI service action with proper parameter binding
                var oAction = oGenAIModel.bindContext("/summarizeFeedback(...)");
                oAction.setParameter("employeeID", parseInt(sEmployeeId));
                oAction.setParameter("timeframe", "last 6 months");

                // Execute the action and bind results to view
                oAction.execute().then(function () {
                    var oBoundContext = oAction.getBoundContext();
                    var sResult = oBoundContext.getProperty("summary");

                    console.log("AI feedback summary generated successfully:", sResult);

                    // Bind the result to the view model
                    oEmployeeDetailModel.setProperty("/feedbackSummary", sResult);
                    oEmployeeDetailModel.setProperty("/isLoadingSummary", false);

                    // Update view with success message
                    sap.m.MessageToast.show(oResourceBundle.getText("summaryGenerated"));

                    // Store the summary for future reference
                    that._storeAIResult("feedbackSummary", sResult, sEmployeeId);

                }).catch(function (oError) {
                    console.error("Error calling summarizeFeedback action:", oError);
                    that._setFallbackFeedbackSummary();
                });

            } catch (oError) {
                console.error("Error setting up summarizeFeedback action:", oError);
                this._setFallbackFeedbackSummary();
            }
        },

        /**
         * Set fallback feedback summary
         * @private
         */
        _setFallbackFeedbackSummary: function () {
            var oEmployeeDetailModel = this.getView().getModel("employeeDetail");
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var oContext = this.getView().getBindingContext();

            // Generate contextual fallback based on available data
            var sFallbackSummary = this._generateContextualFeedbackSummary(oContext);

            oEmployeeDetailModel.setProperty("/feedbackSummary", sFallbackSummary);
            oEmployeeDetailModel.setProperty("/isLoadingSummary", false);

            sap.m.MessageToast.show(oResourceBundle.getText("usingFallbackSummary"));
        },

        /**
         * Generate contextual feedback summary based on employee data
         * @param {sap.ui.model.Context} oContext - Employee context
         * @returns {string} Contextual summary
         * @private
         */
        _generateContextualFeedbackSummary: function (oContext) {
            if (!oContext) {
                return "Unable to generate summary without employee data.";
            }

            var oEmployee = oContext.getObject();
            var aThemes = [];
            var sSummary = "";

            // Analyze feedback data if available
            if (oEmployee.FeedbackReceived && oEmployee.FeedbackReceived.length > 0) {
                var iFeedbackCount = oEmployee.FeedbackReceived.length;
                var aRecentFeedback = oEmployee.FeedbackReceived.slice(-3); // Last 3 feedback items

                sSummary += "Based on " + iFeedbackCount + " feedback entries, ";

                // Analyze feedback types
                var aTypes = aRecentFeedback.map(function(feedback) { return feedback.Type; });
                var aUniqueTypes = [...new Set(aTypes)];

                if (aUniqueTypes.length > 0) {
                    aThemes.push("feedback covers " + aUniqueTypes.join(", "));
                }

                // Check for patterns in feedback content
                var sFeedbackText = aRecentFeedback.map(function(feedback) {
                    return feedback.feedback || "";
                }).join(" ").toLowerCase();

                if (sFeedbackText.includes("performance") || sFeedbackText.includes("goal")) {
                    aThemes.push("performance-related discussions");
                }
                if (sFeedbackText.includes("team") || sFeedbackText.includes("collaboration")) {
                    aThemes.push("teamwork and collaboration");
                }
                if (sFeedbackText.includes("skill") || sFeedbackText.includes("development")) {
                    aThemes.push("skill development opportunities");
                }
                if (sFeedbackText.includes("communication")) {
                    aThemes.push("communication effectiveness");
                }

            } else {
                sSummary += "No recent feedback data available. ";
            }

            // Add performance context
            if (oEmployee.PerformanceMetrics && oEmployee.PerformanceMetrics.length > 0) {
                var oLatestPerformance = oEmployee.PerformanceMetrics[oEmployee.PerformanceMetrics.length - 1];
                if (oLatestPerformance.ObjectiveCompletionRate >= 80) {
                    aThemes.push("strong performance indicators");
                } else if (oLatestPerformance.ObjectiveCompletionRate >= 60) {
                    aThemes.push("moderate performance with improvement opportunities");
                } else {
                    aThemes.push("performance requiring focused attention");
                }
            }

            // Add satisfaction context
            if (oEmployee.SurveyResponses && oEmployee.SurveyResponses.length > 0) {
                var oLatestSurvey = oEmployee.SurveyResponses[oEmployee.SurveyResponses.length - 1];
                if (oLatestSurvey.Score >= 80) {
                    aThemes.push("high satisfaction levels");
                } else if (oLatestSurvey.Score >= 60) {
                    aThemes.push("moderate satisfaction with areas for improvement");
                } else {
                    aThemes.push("satisfaction concerns requiring attention");
                }
            }

            // Compile final summary
            if (aThemes.length > 0) {
                sSummary += "Key themes include: " + aThemes.join(", ") + ". ";
                sSummary += "Recommended actions: schedule regular one-on-ones, provide targeted development opportunities, " +
                          "and continue monitoring progress through structured feedback sessions.";
            } else {
                sSummary += "Consider establishing regular feedback mechanisms to better understand employee development needs " +
                          "and career aspirations.";
            }

            return sSummary;
        },

        /**
         * Store AI result for caching and future reference
         * @param {string} sType - Type of AI result (attritionExplanation, feedbackSummary)
         * @param {string} sResult - AI generated result
         * @param {string} sEmployeeId - Employee ID
         * @private
         */
        _storeAIResult: function (sType, sResult, sEmployeeId) {
            // Store in session storage for caching
            var sKey = "smarthr_ai_" + sType + "_" + sEmployeeId;
            try {
                sessionStorage.setItem(sKey, JSON.stringify({
                    result: sResult,
                    timestamp: new Date().toISOString(),
                    employeeId: sEmployeeId
                }));
                console.log("AI result stored for future reference:", sType, sEmployeeId);
            } catch (oError) {
                console.warn("Could not store AI result in session storage:", oError);
            }
        },

        /**
         * Load cached AI result if available
         * @param {string} sType - Type of AI result
         * @param {string} sEmployeeId - Employee ID
         * @returns {string|null} Cached result or null
         * @private
         */
        _loadCachedAIResult: function (sType, sEmployeeId) {
            var sKey = "smarthr_ai_" + sType + "_" + sEmployeeId;
            try {
                var sStoredData = sessionStorage.getItem(sKey);
                if (sStoredData) {
                    var oData = JSON.parse(sStoredData);
                    var oTimestamp = new Date(oData.timestamp);
                    var oNow = new Date();

                    // Use cached result if less than 1 hour old
                    if ((oNow - oTimestamp) < 3600000) {
                        console.log("Using cached AI result:", sType, sEmployeeId);
                        return oData.result;
                    }
                }
            } catch (oError) {
                console.warn("Could not load cached AI result:", oError);
            }
            return null;
        },

        /**
         * View performance chart
         */
        onViewPerformanceChart: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * View all satisfaction surveys
         */
        onViewAllSatisfaction: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * View all feedback
         */
        onViewAllFeedback: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Refresh employee data
         */
        onRefreshEmployeeData: function () {
            var oContext = this.getView().getBindingContext();
            if (oContext) {
                oContext.refresh();
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("dataRefreshed"));
            }
        },

        /**
         * Export employee profile
         */
        onExportProfile: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Edit employee details
         */
        onEditEmployee: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        // Formatter Methods

        /**
         * Format employee initials for avatar
         * @param {string} sFirstName - First name
         * @param {string} sLastName - Last name
         * @returns {string} Initials
         */
        formatInitials: function (sFirstName, sLastName) {
            if (!sFirstName || !sLastName) {
                return "??";
            }
            return (sFirstName.charAt(0) + sLastName.charAt(0)).toUpperCase();
        },

        /**
         * Format tenure in months to readable text
         * @param {number} iTenureMonths - Tenure in months
         * @returns {string} Formatted tenure
         */
        formatTenure: function (iTenureMonths) {
            if (!iTenureMonths) {
                return "N/A";
            }

            var iYears = Math.floor(iTenureMonths / 12);
            var iMonths = iTenureMonths % 12;

            if (iYears > 0) {
                return iYears + " year" + (iYears > 1 ? "s" : "") +
                       (iMonths > 0 ? ", " + iMonths + " month" + (iMonths > 1 ? "s" : "") : "");
            } else {
                return iMonths + " month" + (iMonths > 1 ? "s" : "");
            }
        },

        /**
         * Format latest performance score
         * @param {Array} aPerformanceMetrics - Performance metrics array
         * @returns {string} Latest performance score
         */
        formatLatestPerformance: function (aPerformanceMetrics) {
            if (!aPerformanceMetrics || aPerformanceMetrics.length === 0) {
                return "N/A";
            }

            // Get the latest performance metric
            var oLatest = aPerformanceMetrics[aPerformanceMetrics.length - 1];
            return Math.round(oLatest.ObjectiveCompletionRate) + "%";
        },

        /**
         * Format latest satisfaction score
         * @param {Array} aSurveyResponses - Survey responses array
         * @returns {string} Latest satisfaction score
         */
        formatLatestSatisfaction: function (aSurveyResponses) {
            if (!aSurveyResponses || aSurveyResponses.length === 0) {
                return "N/A";
            }

            // Get the latest survey response
            var oLatest = aSurveyResponses[aSurveyResponses.length - 1];
            return oLatest.Score + "/100";
        },

        /**
         * Format risk score as percentage
         * @param {number} fRiskScore - Risk score (0-1)
         * @returns {string} Risk percentage
         */
        formatRiskPercentage: function (fRiskScore) {
            if (fRiskScore === null || fRiskScore === undefined) {
                return "N/A";
            }
            return Math.round(fRiskScore * 100);
        },

        /**
         * Format risk state for ObjectStatus
         * @param {string} sUrgencyLevel - Urgency level
         * @returns {string} State
         */
        formatRiskState: function (sUrgencyLevel) {
            switch (sUrgencyLevel) {
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
         * Format performance state for ObjectNumber
         * @param {number} iCompletionRate - Completion rate
         * @returns {string} State
         */
        formatPerformanceState: function (iCompletionRate) {
            if (iCompletionRate >= 90) {
                return "Success";
            } else if (iCompletionRate >= 70) {
                return "Warning";
            } else {
                return "Error";
            }
        },

        /**
         * Format trend icon
         * @param {number} iValue - Current value
         * @returns {string} Icon source
         */
        formatTrendIcon: function (iValue) {
            if (iValue >= 90) {
                return "sap-icon://trend-up";
            } else if (iValue >= 70) {
                return "sap-icon://neutral";
            } else {
                return "sap-icon://trend-down";
            }
        },

        /**
         * Format trend color
         * @param {number} iValue - Current value
         * @returns {string} Color
         */
        formatTrendColor: function (iValue) {
            if (iValue >= 90) {
                return "#2ECC71"; // Green
            } else if (iValue >= 70) {
                return "#F39C12"; // Orange
            } else {
                return "#E74C3C"; // Red
            }
        }
    });
});
