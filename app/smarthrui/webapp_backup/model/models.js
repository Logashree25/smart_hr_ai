sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime info for the device the UI5 app is running on as JSONModel
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        /**
         * Creates a JSON model for application state management
         */
        createAppStateModel: function () {
            var oModel = new JSONModel({
                busy: false,
                delay: 0,
                layout: "OneColumn",
                previousLayout: "",
                actionButtonsInfo: {
                    midColumn: {
                        fullScreen: false
                    }
                }
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a JSON model for user preferences
         */
        createUserPreferencesModel: function () {
            var oModel = new JSONModel({
                theme: "sap_horizon",
                language: "en",
                dateFormat: "MM/dd/yyyy",
                timeFormat: "12h",
                notifications: {
                    email: true,
                    push: false,
                    sms: false
                },
                dashboard: {
                    refreshInterval: 300000, // 5 minutes
                    autoRefresh: true,
                    compactMode: false
                }
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a JSON model for dashboard KPIs and metrics
         */
        createDashboardModel: function () {
            var oModel = new JSONModel({
                kpis: {
                    totalEmployees: 0,
                    avgSatisfaction: 0,
                    highRiskEmployees: 0,
                    openPositions: 0
                },
                trends: {
                    satisfactionTrend: "stable",
                    performanceTrend: "improving",
                    attritionTrend: "decreasing"
                },
                lastUpdated: new Date(),
                loading: false
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a comprehensive JSON model for AI suggestions and insights
         */
        createAISuggestionsModel: function () {
            var oModel = new JSONModel({
                // AI status and processing
                aiStatus: "Ready",
                lastAnalysis: new Date().toISOString(),
                isAnalyzing: false,
                analysisProgress: 0,

                // Summary statistics
                totalSuggestions: 0,
                highImpactCount: 0,
                averageConfidence: 0,
                implementedCount: 0,

                // Suggestions data by category
                engagementIdeas: [],
                trainingRecommendations: [],
                policyEnhancements: [],

                // Legacy AI insights (for backward compatibility)
                insights: [],
                recommendations: [],
                processing: false,
                lastGenerated: null,
                confidence: {
                    high: 0,
                    medium: 0,
                    low: 0
                },

                // Filters and grouping
                filters: {
                    status: "",
                    impact: "",
                    confidence: "",
                    category: ""
                },
                groupBy: "status",
                sortBy: "confidence",
                sortOrder: "desc",

                // UI state
                selectedSuggestions: [],
                expandedSections: {
                    engagement: true,
                    training: true,
                    policy: true
                },

                // Footer and status text
                footerSummaryText: "AI suggestions ready",
                lastUpdated: new Date().toISOString()
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a JSON model for UI state management
         */
        createUIStateModel: function () {
            var oModel = new JSONModel({
                // Navigation state
                currentView: "Dashboard",
                previousView: "",
                navigationHistory: [],

                // Loading states
                isLoading: false,
                isRefreshing: false,
                loadingMessage: "",

                // User preferences
                theme: "sap_horizon",
                language: "en",
                dateFormat: "MM/dd/yyyy",
                timeFormat: "12h",

                // Layout preferences
                sideNavExpanded: true,
                compactMode: false,
                showNotifications: true,

                // Filter states
                globalSearchQuery: "",
                activeFilters: {},

                // Error handling
                hasError: false,
                errorMessage: "",
                errorDetails: "",

                // Feature flags
                features: {
                    aiSuggestions: true,
                    performanceAnalytics: true,
                    attritionMonitoring: true,
                    advancedReporting: true
                },

                // Notification state
                notifications: {
                    count: 0,
                    unreadCount: 0,
                    items: []
                }
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a JSON model for employee data management
         */
        createEmployeeModel: function () {
            var oModel = new JSONModel({
                // Current employee details
                currentEmployee: null,
                selectedEmployees: [],

                // List state
                employees: [],
                filteredEmployees: [],
                totalCount: 0,
                pageSize: 50,
                currentPage: 1,

                // Filters
                filters: {
                    department: "",
                    status: "",
                    location: "",
                    searchQuery: ""
                },

                // Sorting
                sortBy: "lastName",
                sortOrder: "asc",

                // UI state
                viewMode: "list", // list, grid, cards
                showInactive: false,
                selectedCount: 0,

                // Employee details
                employeeDetails: {
                    personalInfo: {},
                    jobInfo: {},
                    performance: {},
                    satisfaction: {},
                    training: {}
                }
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a JSON model for analytics data
         */
        createAnalyticsModel: function () {
            var oModel = new JSONModel({
                // Time range configuration
                timeRange: "12", // months
                dateFrom: null,
                dateTo: null,

                // Chart configurations
                chartTypes: {
                    satisfaction: "line",
                    attrition: "column",
                    performance: "combination"
                },

                // Analytics data
                satisfactionData: [],
                attritionData: [],
                performanceData: [],
                departmentAnalytics: [],

                // Filters
                selectedDepartments: [],
                selectedMetrics: [],

                // Export options
                exportFormat: "excel",
                includeCharts: true,

                // Loading state
                isLoading: false,
                lastUpdated: new Date().toISOString()
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a JSON model for hiring needs management
         */
        createHiringNeedsModel: function () {
            var oModel = new JSONModel({
                // Summary statistics
                totalPositions: 0,
                urgentPositions: 0,
                activeRecruiting: 0,
                filledPositions: 0,

                // Positions data
                openPositions: [],
                filteredPositions: [],

                // Filters
                filters: {
                    department: "",
                    status: "",
                    priority: "",
                    searchQuery: ""
                },

                // Available filter options
                departments: [],
                statuses: ["Active", "On Hold", "Filled", "Cancelled"],
                priorities: ["Urgent", "High", "Medium", "Low"],

                // Sorting
                sortBy: "priority",
                sortOrder: "desc",

                // UI state
                selectedPositions: [],
                showClosed: false,

                // Summary text
                summaryText: "Loading positions...",
                footerSummaryText: "Hiring data loading..."
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a JSON model for performance analytics
         */
        createPerformanceAnalyticsModel: function () {
            var oModel = new JSONModel({
                // View configuration
                viewType: "department", // department, team, individual
                timeRange: "12", // months
                chartType: "line", // line, column, combination

                // Chart data
                chartData: [],
                tableData: [],

                // Summary KPIs
                overallCompletionRate: 0,
                overallTrend: "neutral",
                overallTrendText: "Stable performance",
                topDepartment: {
                    name: "",
                    score: 0
                },
                improvementDepartment: {
                    name: "",
                    score: 0
                },

                // Chart properties for VizFrame
                vizProperties: {
                    title: {
                        text: "Performance Trends"
                    },
                    categoryAxis: {
                        title: {
                            text: "Time Period"
                        }
                    },
                    valueAxis: {
                        title: {
                            text: "Completion Rate (%)"
                        }
                    },
                    plotArea: {
                        colorPalette: ["#5cbae6", "#b6d957", "#fac364", "#8cd3ff", "#d998cb"]
                    }
                },

                // UI state
                chartInfo: "",
                summaryText: "Loading performance data...",
                lastUpdated: new Date().toISOString()
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates a JSON model for attrition monitoring
         */
        createAttritionMonitorModel: function () {
            var oModel = new JSONModel({
                // Summary metrics
                totalAtRisk: 0,
                highRiskCount: 0,
                mediumRiskCount: 0,
                lowRiskCount: 0,
                overallAttritionRate: 0,

                // Risk data
                atRiskEmployees: [],
                riskFactors: [],
                departmentRisks: [],

                // Filters
                filters: {
                    riskLevel: "",
                    department: "",
                    timeframe: "6" // months
                },

                // Chart data
                riskTrendData: [],
                departmentRiskData: [],

                // Predictions
                predictions: {
                    nextQuarter: 0,
                    nextSixMonths: 0,
                    nextYear: 0
                },

                // UI state
                selectedEmployees: [],
                showPredictions: true,
                alertsEnabled: true,

                // Summary
                summaryText: "Loading attrition data...",
                lastAnalysis: new Date().toISOString()
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },

        /**
         * Creates all models and returns them as an object
         * @returns {object} Object containing all models
         */
        createAllModels: function () {
            return {
                device: this.createDeviceModel(),
                appState: this.createAppStateModel(),
                userPreferences: this.createUserPreferencesModel(),
                dashboard: this.createDashboardModel(),
                aiSuggestions: this.createAISuggestionsModel(),
                uiState: this.createUIStateModel(),
                employee: this.createEmployeeModel(),
                analytics: this.createAnalyticsModel(),
                hiringNeeds: this.createHiringNeedsModel(),
                performanceAnalytics: this.createPerformanceAnalyticsModel(),
                attritionMonitor: this.createAttritionMonitorModel()
            };
        },

        /**
         * Set all models on a component
         * @param {sap.ui.core.Component} oComponent - Component instance
         */
        setModelsOnComponent: function (oComponent) {
            var oModels = this.createAllModels();

            // Set each model on the component
            Object.keys(oModels).forEach(function (sModelName) {
                oComponent.setModel(oModels[sModelName], sModelName);
            });

            // Set device model as default device model (for backward compatibility)
            oComponent.setModel(oModels.device, "device");
        },

        /**
         * Initialize model data with default values
         * @param {object} oModels - Models object or component with models
         */
        initializeModelData: function (oModels) {
            var bIsComponent = oModels.getModel !== undefined;

            // Helper function to get model
            var getModel = function (sName) {
                return bIsComponent ? oModels.getModel(sName) : oModels[sName];
            };

            // Initialize UI state
            var oUIStateModel = getModel("uiState");
            if (oUIStateModel) {
                oUIStateModel.setProperty("/currentView", "Dashboard");
                oUIStateModel.setProperty("/isLoading", false);
            }

            // Initialize AI suggestions
            var oAISuggestionsModel = getModel("aiSuggestions");
            if (oAISuggestionsModel) {
                oAISuggestionsModel.setProperty("/aiStatus", "Ready");
                oAISuggestionsModel.setProperty("/totalSuggestions", 0);
            }

            // Initialize dashboard
            var oDashboardModel = getModel("dashboard");
            if (oDashboardModel) {
                oDashboardModel.setProperty("/loading", false);
                oDashboardModel.setProperty("/lastUpdated", new Date());
            }

            // Initialize app state
            var oAppStateModel = getModel("appState");
            if (oAppStateModel) {
                oAppStateModel.setProperty("/busy", false);
                oAppStateModel.setProperty("/layout", "OneColumn");
            }
        }
    };
});
