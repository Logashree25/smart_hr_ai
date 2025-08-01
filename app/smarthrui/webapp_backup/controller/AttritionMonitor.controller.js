sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter"
], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator, Sorter) {
    "use strict";

    return Controller.extend("smart.hr.portal.controller.AttritionMonitor", {

        /**
         * Called when the controller is instantiated.
         */
        onInit: function () {
            // Get router and attach route matched handler
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("RouteAttritionMonitor").attachPatternMatched(this._onRouteMatched, this);
            
            // Initialize local models
            this._initializeModels();
            
            // Load attrition data
            this._loadAttritionData();
        },

        /**
         * Initialize local models for attrition monitor
         * @private
         */
        _initializeModels: function () {
            // Create attrition monitor model for local state
            var oAttritionMonitorModel = new JSONModel({
                highRiskCount: 0,
                mediumRiskCount: 0,
                totalAtRiskCount: 0,
                summaryText: "Loading attrition data...",
                filters: {
                    urgencyLevel: "",
                    department: ""
                },
                sorting: {
                    field: "RiskScore",
                    descending: true
                },
                departments: [],
                explanationCache: {} // Cache for AI explanations
            });
            
            this.getView().setModel(oAttritionMonitorModel, "attritionMonitor");
        },

        /**
         * Route matched handler
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            // Refresh attrition data when route is matched
            this._loadAttritionData();
        },

        /**
         * Load attrition data from AttritionRisk entity with expanded employee info
         * @private
         */
        _loadAttritionData: function () {
            var oModel = this.getView().getModel(); // HR Service OData model
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var that = this;

            console.log("Querying AttritionRisk entity with expanded employee info...");

            // Query AttritionRisk entity with comprehensive expansion
            var oBinding = oModel.bindList("/AttritionRisk", null, null, null, {
                $expand: "Employee($expand=PerformanceMetrics,SurveyResponses,FeedbackReceived,TrainingRecommendations)",
                $orderby: "RiskScore desc"
            });

            // Set loading state
            oAttritionMonitorModel.setProperty("/summaryText", "Loading attrition risk data...");

            // Request all attrition risk contexts with expanded employee data
            oBinding.requestContexts().then(function (aContexts) {
                console.log("Successfully loaded " + aContexts.length + " attrition risk records with expanded employee data");

                // Log sample data structure for debugging
                if (aContexts.length > 0) {
                    var oSampleData = aContexts[0].getObject();
                    console.log("Sample AttritionRisk data structure:", {
                        riskScore: oSampleData.RiskScore,
                        urgencyLevel: oSampleData.UrgencyLevel,
                        employeeId: oSampleData.Employee ? oSampleData.Employee.ID : "No employee data",
                        employeeName: oSampleData.Employee ?
                            oSampleData.Employee.FirstName + " " + oSampleData.Employee.LastName : "No name",
                        hasPerformanceMetrics: oSampleData.Employee && oSampleData.Employee.PerformanceMetrics ?
                            oSampleData.Employee.PerformanceMetrics.length : 0,
                        hasFeedback: oSampleData.Employee && oSampleData.Employee.FeedbackReceived ?
                            oSampleData.Employee.FeedbackReceived.length : 0
                    });
                }

                // Process and categorize risk data
                that._processAttritionData(aContexts);

                // Extract departments for filtering
                that._extractDepartments(aContexts);

                // Pre-load cached explanations
                that._loadCachedExplanations(aContexts);

            }).catch(function (oError) {
                console.error("Error querying AttritionRisk entity:", oError);
                oAttritionMonitorModel.setProperty("/summaryText", "Error loading attrition data");
                MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("errorLoadingAttritionData"));
            });
        },

        /**
         * Load cached explanations for employees
         * @param {Array} aContexts - Attrition risk contexts
         * @private
         */
        _loadCachedExplanations: function (aContexts) {
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var oExplanationCache = {};

            aContexts.forEach(function (oContext) {
                var oAttritionRisk = oContext.getObject();
                if (oAttritionRisk.Employee && oAttritionRisk.Employee.ID) {
                    var sEmployeeId = oAttritionRisk.Employee.ID;

                    // Try to load cached explanation
                    var sCachedExplanation = this._loadCachedAIResult("attritionExplanation", sEmployeeId);
                    if (sCachedExplanation) {
                        oExplanationCache[sEmployeeId] = sCachedExplanation;
                    }
                }
            }.bind(this));

            oAttritionMonitorModel.setProperty("/explanationCache", oExplanationCache);
            console.log("Loaded cached explanations for " + Object.keys(oExplanationCache).length + " employees");
        },

        /**
         * Process and categorize attrition data
         * @param {Array} aContexts - Attrition risk contexts
         * @private
         */
        _processAttritionData: function (aContexts) {
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var iHighRiskCount = 0;
            var iMediumRiskCount = 0;
            var iTotalAtRiskCount = 0;
            
            aContexts.forEach(function (oContext) {
                var oAttritionRisk = oContext.getObject();
                var fRiskScore = oAttritionRisk.RiskScore;
                
                if (fRiskScore > 0.6) {
                    iHighRiskCount++;
                    iTotalAtRiskCount++;
                } else if (fRiskScore > 0.3) {
                    iMediumRiskCount++;
                    iTotalAtRiskCount++;
                }
            });
            
            // Update summary counts
            oAttritionMonitorModel.setProperty("/highRiskCount", iHighRiskCount);
            oAttritionMonitorModel.setProperty("/mediumRiskCount", iMediumRiskCount);
            oAttritionMonitorModel.setProperty("/totalAtRiskCount", iTotalAtRiskCount);
            oAttritionMonitorModel.setProperty("/summaryText", 
                "Total at-risk employees: " + iTotalAtRiskCount + 
                " (High: " + iHighRiskCount + ", Medium: " + iMediumRiskCount + ")");
            
            console.log("Attrition data processed:", {
                high: iHighRiskCount,
                medium: iMediumRiskCount,
                total: iTotalAtRiskCount
            });
        },

        /**
         * Extract unique departments for filtering
         * @param {Array} aContexts - Attrition risk contexts
         * @private
         */
        _extractDepartments: function (aContexts) {
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var aDepartments = [""];  // Start with empty option for "All Departments"
            
            aContexts.forEach(function (oContext) {
                var oAttritionRisk = oContext.getObject();
                if (oAttritionRisk.Employee && oAttritionRisk.Employee.Department) {
                    var sDepartment = oAttritionRisk.Employee.Department;
                    if (aDepartments.indexOf(sDepartment) === -1) {
                        aDepartments.push(sDepartment);
                    }
                }
            });
            
            // Sort departments (keeping empty option first)
            aDepartments.sort(function(a, b) {
                if (a === "") return -1;
                if (b === "") return 1;
                return a.localeCompare(b);
            });
            
            oAttritionMonitorModel.setProperty("/departments", aDepartments);
            console.log("Departments extracted for filtering:", aDepartments.length - 1);
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
         * Handle urgency level filter change
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onUrgencyFilterChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("attritionMonitor").setProperty("/filters/urgencyLevel", sSelectedKey);
            this._applyFilters();
        },

        /**
         * Handle department filter change
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onDepartmentFilterChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("attritionMonitor").setProperty("/filters/department", sSelectedKey);
            this._applyFilters();
        },

        /**
         * Handle sort change
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onSortChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("attritionMonitor").setProperty("/sorting/field", sSelectedKey);
            this._applySorting();
        },

        /**
         * Clear all filters
         */
        onClearFilters: function () {
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            
            // Clear filter values
            oAttritionMonitorModel.setProperty("/filters/urgencyLevel", "");
            oAttritionMonitorModel.setProperty("/filters/department", "");
            
            // Reset combo boxes
            this.byId("urgencyFilterCombo").setSelectedKey("");
            this.byId("departmentFilterCombo").setSelectedKey("");
            
            // Apply empty filters
            this._applyFilters();
            
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("filtersCleared"));
        },

        /**
         * Apply filters to both lists
         * @private
         */
        _applyFilters: function () {
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var sUrgencyLevel = oAttritionMonitorModel.getProperty("/filters/urgencyLevel");
            var sDepartment = oAttritionMonitorModel.getProperty("/filters/department");
            
            var aFilters = [];
            
            // Add urgency level filter
            if (sUrgencyLevel && sUrgencyLevel.length > 0) {
                aFilters.push(new Filter("UrgencyLevel", FilterOperator.EQ, sUrgencyLevel));
            }
            
            // Add department filter
            if (sDepartment && sDepartment.length > 0) {
                aFilters.push(new Filter("Employee/Department", FilterOperator.EQ, sDepartment));
            }
            
            // Apply filters to both high-risk and medium-risk lists
            var oHighRiskList = this.byId("highRiskEmployeesList");
            var oMediumRiskList = this.byId("mediumRiskEmployeesList");
            
            if (oHighRiskList.getBinding("items")) {
                oHighRiskList.getBinding("items").filter(aFilters);
            }
            
            if (oMediumRiskList.getBinding("items")) {
                oMediumRiskList.getBinding("items").filter(aFilters);
            }
            
            console.log("Filters applied:", {
                urgency: sUrgencyLevel,
                department: sDepartment,
                totalFilters: aFilters.length
            });
        },

        /**
         * Apply sorting to both lists
         * @private
         */
        _applySorting: function () {
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var sSortField = oAttritionMonitorModel.getProperty("/sorting/field");
            var bDescending = oAttritionMonitorModel.getProperty("/sorting/descending");
            
            var oSorter;
            
            switch (sSortField) {
                case "RiskScore":
                    oSorter = new Sorter("RiskScore", true); // Always descending for risk score
                    break;
                case "UrgencyLevel":
                    oSorter = new Sorter("UrgencyLevel", bDescending);
                    break;
                case "EmployeeName":
                    oSorter = new Sorter("Employee/LastName", bDescending);
                    break;
                case "Department":
                    oSorter = new Sorter("Employee/Department", bDescending);
                    break;
                default:
                    oSorter = new Sorter("RiskScore", true);
            }
            
            // Apply sorting to both lists
            var oHighRiskList = this.byId("highRiskEmployeesList");
            var oMediumRiskList = this.byId("mediumRiskEmployeesList");
            
            if (oHighRiskList.getBinding("items")) {
                oHighRiskList.getBinding("items").sort(oSorter);
            }
            
            if (oMediumRiskList.getBinding("items")) {
                oMediumRiskList.getBinding("items").sort(oSorter);
            }
            
            console.log("Sorting applied:", sSortField, bDescending);
        },

        /**
         * Handle employee selection
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onEmployeeSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext();
                var sEmployeeId = oContext.getProperty("Employee/ID");

                console.log("Employee selected for attrition monitoring:", sEmployeeId);
            }
        },

        /**
         * Handle employee press to navigate to detail view
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onEmployeePress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oContext.getProperty("Employee/ID");

            // Navigate to employee detail view
            this.oRouter.navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        /**
         * View employee details
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onViewEmployee: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oContext.getProperty("Employee/ID");

            // Navigate to employee detail view
            this.oRouter.navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        /**
         * Generate AI explanation for specific employee
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onGenerateExplanation: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oContext.getProperty("Employee/ID");
            var sEmployeeName = oContext.getProperty("Employee/FirstName") + " " + oContext.getProperty("Employee/LastName");

            this._generateAttritionExplanation(sEmployeeId, sEmployeeName, false);
        },

        /**
         * Refresh AI explanation for specific employee (force regeneration)
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onRefreshExplanation: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oContext.getProperty("Employee/ID");
            var sEmployeeName = oContext.getProperty("Employee/FirstName") + " " + oContext.getProperty("Employee/LastName");

            // Force refresh by clearing cache first
            this._clearCachedExplanation(sEmployeeId);

            // Generate new explanation
            this._generateAttritionExplanation(sEmployeeId, sEmployeeName, true);
        },

        /**
         * Clear cached explanation for specific employee
         * @param {string} sEmployeeId - Employee ID
         * @private
         */
        _clearCachedExplanation: function (sEmployeeId) {
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var oExplanationCache = oAttritionMonitorModel.getProperty("/explanationCache");

            // Remove from local cache
            if (oExplanationCache && oExplanationCache[sEmployeeId]) {
                delete oExplanationCache[sEmployeeId];
                oAttritionMonitorModel.setProperty("/explanationCache", oExplanationCache);
            }

            // Remove from session storage
            var sKey = "smarthr_ai_attritionExplanation_" + sEmployeeId;
            try {
                sessionStorage.removeItem(sKey);
                console.log("Cleared cached explanation for employee:", sEmployeeId);
            } catch (oError) {
                console.warn("Could not clear cached explanation:", oError);
            }
        },

        /**
         * View full explanation for employee
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onViewFullExplanation: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oContext.getProperty("Employee/ID");
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var oExplanationCache = oAttritionMonitorModel.getProperty("/explanationCache");

            var sExplanation = oExplanationCache[sEmployeeId] || "No explanation available. Click 'Generate Explanation' to create one.";

            MessageBox.information(sExplanation, {
                title: this.getView().getModel("i18n").getResourceBundle().getText("fullAttritionExplanation"),
                contentWidth: "500px"
            });
        },

        /**
         * Generate AI explanation for specific employee with enhanced context
         * @param {string} sEmployeeId - Employee ID
         * @param {string} sEmployeeName - Employee name for display
         * @param {boolean} bForceRefresh - Whether to force refresh (ignore cache)
         * @private
         */
        _generateAttritionExplanation: function (sEmployeeId, sEmployeeName, bForceRefresh) {
            var oGenAIModel = this.getView().getModel("genai");
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var that = this;

            console.log("Generating attrition explanation for employee:", sEmployeeId, sEmployeeName, "Force refresh:", bForceRefresh);

            // Check for existing explanation if not forcing refresh
            if (!bForceRefresh) {
                var oExplanationCache = oAttritionMonitorModel.getProperty("/explanationCache");
                if (oExplanationCache && oExplanationCache[sEmployeeId]) {
                    MessageToast.show("Explanation already exists for " + sEmployeeName + ". Use refresh to regenerate.");
                    return;
                }
            }

            // Show appropriate loading message
            var sLoadingMessage = bForceRefresh ?
                oResourceBundle.getText("refreshingExplanation") + " for " + sEmployeeName :
                oResourceBundle.getText("generatingExplanation") + " for " + sEmployeeName;
            MessageToast.show(sLoadingMessage);

            // Get employee context for enhanced explanation
            var oEmployeeContext = this._getEmployeeContext(sEmployeeId);

            // Check if GenAI model is available
            if (!oGenAIModel) {
                console.warn("GenAI model not available, using contextual fallback explanation");
                this._setContextualFallbackExplanation(sEmployeeId, sEmployeeName, oEmployeeContext);
                return;
            }

            try {
                // Call GenAI service action with enhanced parameters
                var oAction = oGenAIModel.bindContext("/explainAttritionRisk(...)");
                oAction.setParameter("employeeID", parseInt(sEmployeeId));

                // Add additional context parameters if available
                if (oEmployeeContext) {
                    oAction.setParameter("includePerformanceData", true);
                    oAction.setParameter("includeFeedbackData", true);
                    oAction.setParameter("timeframe", "last 12 months");
                }

                oAction.execute().then(function () {
                    var sResult = oAction.getBoundContext().getProperty("explanation");

                    console.log("AI explanation generated successfully for employee:", sEmployeeId);

                    // Store explanation in cache
                    var oExplanationCache = oAttritionMonitorModel.getProperty("/explanationCache");
                    oExplanationCache[sEmployeeId] = sResult;
                    oAttritionMonitorModel.setProperty("/explanationCache", oExplanationCache);

                    // Store in session storage for persistence
                    that._storeAIResult("attritionExplanation", sResult, sEmployeeId);

                    // Refresh the list to show updated excerpts
                    that._refreshLists();

                    var sSuccessMessage = bForceRefresh ?
                        oResourceBundle.getText("explanationRefreshed") + " for " + sEmployeeName :
                        oResourceBundle.getText("explanationGenerated") + " for " + sEmployeeName;
                    MessageToast.show(sSuccessMessage);

                }).catch(function (oError) {
                    console.error("Error generating explanation for employee:", sEmployeeId, oError);
                    that._setContextualFallbackExplanation(sEmployeeId, sEmployeeName, oEmployeeContext);
                });

            } catch (oError) {
                console.error("Error setting up explanation generation:", oError);
                this._setContextualFallbackExplanation(sEmployeeId, sEmployeeName, oEmployeeContext);
            }
        },

        /**
         * Get employee context from AttritionRisk data
         * @param {string} sEmployeeId - Employee ID
         * @returns {object|null} Employee context object
         * @private
         */
        _getEmployeeContext: function (sEmployeeId) {
            var oHighRiskList = this.byId("highRiskEmployeesList");
            var oMediumRiskList = this.byId("mediumRiskEmployeesList");

            // Search in high-risk list first
            var aHighRiskItems = oHighRiskList.getItems();
            for (var i = 0; i < aHighRiskItems.length; i++) {
                var oContext = aHighRiskItems[i].getBindingContext();
                if (oContext && oContext.getProperty("Employee/ID") === sEmployeeId) {
                    return oContext.getObject();
                }
            }

            // Search in medium-risk list
            var aMediumRiskItems = oMediumRiskList.getItems();
            for (var j = 0; j < aMediumRiskItems.length; j++) {
                var oContext = aMediumRiskItems[j].getBindingContext();
                if (oContext && oContext.getProperty("Employee/ID") === sEmployeeId) {
                    return oContext.getObject();
                }
            }

            return null;
        },

        /**
         * Set contextual fallback explanation for employee
         * @param {string} sEmployeeId - Employee ID
         * @param {string} sEmployeeName - Employee name
         * @param {object} oEmployeeContext - Employee context data
         * @private
         */
        _setContextualFallbackExplanation: function (sEmployeeId, sEmployeeName, oEmployeeContext) {
            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            var sFallbackExplanation = this._generateContextualExplanation(sEmployeeName, oEmployeeContext);

            // Store fallback explanation in cache
            var oExplanationCache = oAttritionMonitorModel.getProperty("/explanationCache");
            oExplanationCache[sEmployeeId] = sFallbackExplanation;
            oAttritionMonitorModel.setProperty("/explanationCache", oExplanationCache);

            // Store in session storage for persistence
            this._storeAIResult("attritionExplanation", sFallbackExplanation, sEmployeeId);

            // Refresh the list to show updated excerpts
            this._refreshLists();

            MessageToast.show(oResourceBundle.getText("usingFallbackExplanation"));
        },

        /**
         * Generate contextual explanation based on employee data
         * @param {string} sEmployeeName - Employee name
         * @param {object} oEmployeeContext - Employee context data
         * @returns {string} Contextual explanation
         * @private
         */
        _generateContextualExplanation: function (sEmployeeName, oEmployeeContext) {
            if (!oEmployeeContext || !oEmployeeContext.Employee) {
                return "Employee " + sEmployeeName + " shows elevated attrition risk. " +
                       "Recommended actions include conducting one-on-one meetings and reviewing retention strategies.";
            }

            var oEmployee = oEmployeeContext.Employee;
            var fRiskScore = oEmployeeContext.RiskScore;
            var sUrgencyLevel = oEmployeeContext.UrgencyLevel;
            var aRiskFactors = [];
            var aRecommendations = [];

            // Analyze risk score
            if (fRiskScore > 0.8) {
                aRiskFactors.push("very high risk score (" + Math.round(fRiskScore * 100) + "%)");
                aRecommendations.push("immediate intervention required");
            } else if (fRiskScore > 0.6) {
                aRiskFactors.push("elevated risk score (" + Math.round(fRiskScore * 100) + "%)");
                aRecommendations.push("proactive retention measures needed");
            }

            // Analyze urgency level
            if (sUrgencyLevel === "High") {
                aRiskFactors.push("high urgency classification");
                aRecommendations.push("schedule immediate manager discussion");
            }

            // Analyze performance data
            if (oEmployee.PerformanceMetrics && oEmployee.PerformanceMetrics.length > 0) {
                var oLatestPerformance = oEmployee.PerformanceMetrics[oEmployee.PerformanceMetrics.length - 1];
                if (oLatestPerformance.ObjectiveCompletionRate < 70) {
                    aRiskFactors.push("recent performance below expectations (" + oLatestPerformance.ObjectiveCompletionRate + "%)");
                    aRecommendations.push("provide performance improvement support");
                } else if (oLatestPerformance.ObjectiveCompletionRate >= 90) {
                    aRiskFactors.push("high performance but potential burnout risk");
                    aRecommendations.push("assess workload and provide recognition");
                }
            }

            // Analyze satisfaction data
            if (oEmployee.SurveyResponses && oEmployee.SurveyResponses.length > 0) {
                var oLatestSurvey = oEmployee.SurveyResponses[oEmployee.SurveyResponses.length - 1];
                if (oLatestSurvey.Score < 60) {
                    aRiskFactors.push("low satisfaction scores (" + oLatestSurvey.Score + "/100)");
                    aRecommendations.push("address satisfaction concerns through targeted interventions");
                } else if (oLatestSurvey.Score < 75) {
                    aRiskFactors.push("moderate satisfaction levels requiring attention");
                    aRecommendations.push("conduct satisfaction improvement initiatives");
                }
            }

            // Analyze feedback patterns
            if (oEmployee.FeedbackReceived && oEmployee.FeedbackReceived.length > 0) {
                var iFeedbackCount = oEmployee.FeedbackReceived.length;
                if (iFeedbackCount < 2) {
                    aRiskFactors.push("limited feedback history indicating potential disengagement");
                    aRecommendations.push("establish regular feedback mechanisms");
                } else {
                    // Analyze recent feedback sentiment (simplified)
                    var aRecentFeedback = oEmployee.FeedbackReceived.slice(-3);
                    var bHasNegativeFeedback = aRecentFeedback.some(function(feedback) {
                        return feedback.Type === "Improvement" || feedback.Type === "Concern";
                    });

                    if (bHasNegativeFeedback) {
                        aRiskFactors.push("recent feedback indicates areas of concern");
                        aRecommendations.push("address feedback concerns through development planning");
                    }
                }
            }

            // Analyze tenure
            if (oEmployee.TenureMonths < 12) {
                aRiskFactors.push("short tenure (" + oEmployee.TenureMonths + " months) - new employee risk");
                aRecommendations.push("enhance onboarding and mentorship programs");
            } else if (oEmployee.TenureMonths > 60) {
                aRiskFactors.push("long tenure (" + Math.round(oEmployee.TenureMonths / 12) + " years) - potential career stagnation");
                aRecommendations.push("explore career advancement and development opportunities");
            }

            // Analyze department and role context
            if (oEmployee.Department) {
                aRiskFactors.push("department: " + oEmployee.Department);
            }
            if (oEmployee.Role) {
                aRiskFactors.push("role: " + oEmployee.Role);
            }

            // Construct explanation
            var sExplanation = "Employee " + sEmployeeName + " has been identified as at-risk for attrition. ";

            if (aRiskFactors.length > 0) {
                sExplanation += "Key risk factors include: " + aRiskFactors.slice(0, 5).join(", ") + ". ";
            }

            if (aRecommendations.length > 0) {
                sExplanation += "Recommended actions: " + aRecommendations.slice(0, 4).join(", ") + ". ";
            }

            sExplanation += "Consider implementing a comprehensive retention strategy including regular check-ins, " +
                          "career development discussions, and addressing any identified concerns promptly.";

            return sExplanation;
        },

        /**
         * Store AI result for caching and future reference
         * @param {string} sType - Type of AI result
         * @param {string} sResult - AI generated result
         * @param {string} sEmployeeId - Employee ID
         * @private
         */
        _storeAIResult: function (sType, sResult, sEmployeeId) {
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

                    // Use cached result if less than 2 hours old
                    if ((oNow - oTimestamp) < 7200000) {
                        console.log("Using cached AI result:", sType, sEmployeeId);
                        return oData.result;
                    } else {
                        // Remove expired cache
                        sessionStorage.removeItem(sKey);
                        console.log("Expired cached result removed:", sType, sEmployeeId);
                    }
                }
            } catch (oError) {
                console.warn("Could not load cached AI result:", oError);
            }
            return null;
        },

        /**
         * Generate explanations for all high-risk employees
         */
        onGenerateAllExplanations: function () {
            var oHighRiskList = this.byId("highRiskEmployeesList");
            var aItems = oHighRiskList.getItems();
            var that = this;

            if (aItems.length === 0) {
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("noHighRiskEmployees"));
                return;
            }

            MessageBox.confirm(
                this.getView().getModel("i18n").getResourceBundle().getText("confirmGenerateAllExplanations"),
                {
                    title: this.getView().getModel("i18n").getResourceBundle().getText("generateAllExplanations"),
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that._generateAllExplanations(aItems);
                        }
                    }
                }
            );
        },

        /**
         * Generate explanations for all provided items
         * @param {Array} aItems - List items
         * @private
         */
        _generateAllExplanations: function (aItems) {
            var that = this;
            var iProcessed = 0;
            var iTotal = aItems.length;

            MessageToast.show("Generating explanations for " + iTotal + " employees...");

            aItems.forEach(function (oItem, iIndex) {
                var oContext = oItem.getBindingContext();
                var sEmployeeId = oContext.getProperty("Employee/ID");
                var sEmployeeName = oContext.getProperty("Employee/FirstName") + " " + oContext.getProperty("Employee/LastName");

                // Stagger the requests to avoid overwhelming the service
                setTimeout(function () {
                    that._generateAttritionExplanation(sEmployeeId, sEmployeeName);
                    iProcessed++;

                    if (iProcessed === iTotal) {
                        MessageToast.show("All explanations generated successfully!");
                    }
                }, iIndex * 1000); // 1 second delay between requests
            });
        },

        /**
         * Refresh both lists to show updated data
         * @private
         */
        _refreshLists: function () {
            var oHighRiskList = this.byId("highRiskEmployeesList");
            var oMediumRiskList = this.byId("mediumRiskEmployeesList");

            if (oHighRiskList.getBinding("items")) {
                oHighRiskList.getBinding("items").refresh();
            }

            if (oMediumRiskList.getBinding("items")) {
                oMediumRiskList.getBinding("items").refresh();
            }
        },

        /**
         * Refresh attrition data
         */
        onRefreshAttritionData: function () {
            this._loadAttritionData();
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("attritionDataRefreshed"));
        },

        /**
         * Export attrition data
         */
        onExportAttritionData: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Create retention plan
         */
        onCreateRetentionPlan: function () {
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
         * Format risk state for ObjectStatus and ObjectNumber
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
         * Format urgency highlight for list items
         * @param {string} sUrgencyLevel - Urgency level
         * @returns {string} Highlight state
         */
        formatUrgencyHighlight: function (sUrgencyLevel) {
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
         * Format urgency icon
         * @param {string} sUrgencyLevel - Urgency level
         * @returns {string} Icon source
         */
        formatUrgencyIcon: function (sUrgencyLevel) {
            switch (sUrgencyLevel) {
                case "High":
                    return "sap-icon://alert";
                case "Medium":
                    return "sap-icon://warning";
                case "Low":
                    return "sap-icon://information";
                default:
                    return "sap-icon://neutral";
            }
        },

        /**
         * Format urgency color
         * @param {string} sUrgencyLevel - Urgency level
         * @returns {string} Color
         */
        formatUrgencyColor: function (sUrgencyLevel) {
            switch (sUrgencyLevel) {
                case "High":
                    return "#E74C3C"; // Red
                case "Medium":
                    return "#F39C12"; // Orange
                case "Low":
                    return "#2ECC71"; // Green
                default:
                    return "#666666"; // Gray
            }
        },

        /**
         * Format AI explanation excerpt
         * @param {string} sEmployeeId - Employee ID
         * @returns {string} Explanation excerpt
         */
        formatExplanationExcerpt: function (sEmployeeId) {
            if (!sEmployeeId) {
                return "No explanation available";
            }

            var oAttritionMonitorModel = this.getView().getModel("attritionMonitor");
            var oExplanationCache = oAttritionMonitorModel.getProperty("/explanationCache");

            if (oExplanationCache && oExplanationCache[sEmployeeId]) {
                var sFullExplanation = oExplanationCache[sEmployeeId];

                // Create excerpt (first 150 characters)
                if (sFullExplanation.length > 150) {
                    return sFullExplanation.substring(0, 150) + "...";
                } else {
                    return sFullExplanation;
                }
            } else {
                return "Click 'Generate Explanation' to create AI-powered risk analysis for this employee.";
            }
        }
    });
});
