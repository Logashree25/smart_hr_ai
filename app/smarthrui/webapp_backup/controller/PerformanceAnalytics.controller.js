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

    return Controller.extend("smart.hr.portal.controller.PerformanceAnalytics", {

        /**
         * Called when the controller is instantiated.
         */
        onInit: function () {
            // Get router and attach route matched handler
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("RoutePerformanceAnalytics").attachPatternMatched(this._onRouteMatched, this);
            
            // Initialize local models
            this._initializeModels();
            
            // Load performance analytics data
            this._loadPerformanceData();
        },

        /**
         * Initialize local models for performance analytics
         * @private
         */
        _initializeModels: function () {
            // Create performance analytics model for local state
            var oPerformanceAnalyticsModel = new JSONModel({
                timeRange: "6", // Default to last 6 months
                viewType: "department", // Default to department view
                chartType: "line", // Default to line chart
                overallCompletionRate: 0,
                overallTrend: "neutral",
                overallTrendText: "Loading...",
                topDepartment: {
                    name: "Loading...",
                    score: 0
                },
                improvementDepartment: {
                    name: "Loading...",
                    score: 0
                },
                chartData: [],
                tableData: [],
                chartInfo: "Loading performance data...",
                lastUpdated: new Date().toLocaleDateString(),
                summaryText: "Loading analytics...",
                vizProperties: this._getDefaultVizProperties()
            });
            
            this.getView().setModel(oPerformanceAnalyticsModel, "performanceAnalytics");
        },

        /**
         * Get default VizFrame properties
         * @returns {object} Default viz properties
         * @private
         */
        _getDefaultVizProperties: function () {
            return {
                plotArea: {
                    dataLabel: {
                        visible: true,
                        showTotal: true
                    },
                    colorPalette: ["#5cbae6", "#b6d957", "#fac364", "#8cd3ff", "#d998cb", "#f998a5", "#81ca9d"]
                },
                valueAxis: {
                    title: {
                        visible: true,
                        text: "Completion Rate (%)"
                    }
                },
                categoryAxis: {
                    title: {
                        visible: true,
                        text: "Time Period"
                    }
                },
                title: {
                    visible: true,
                    text: "Performance Trends"
                },
                legend: {
                    visible: true,
                    position: "bottom"
                }
            };
        },

        /**
         * Route matched handler
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            // Refresh performance data when route is matched
            this._loadPerformanceData();
        },

        /**
         * Load aggregated performance analytics data from PerformanceMetrics entity
         * @private
         */
        _loadPerformanceData: function () {
            var oModel = this.getView().getModel(); // HR Service OData model
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var sViewType = oPerformanceAnalyticsModel.getProperty("/viewType");
            var iTimeRange = parseInt(oPerformanceAnalyticsModel.getProperty("/timeRange"));
            var that = this;

            console.log("Fetching aggregated PerformanceMetrics by", sViewType, "for", iTimeRange, "months");

            // Set loading state
            oPerformanceAnalyticsModel.setProperty("/summaryText", "Loading performance analytics...");

            // Calculate date filter for time period selection
            var dCutoffDate = new Date();
            dCutoffDate.setMonth(dCutoffDate.getMonth() - iTimeRange);
            var sCutoffDateString = dCutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format

            // Build OData query with time period filter
            var oBinding = oModel.bindList("/PerformanceMetrics", null, null, null, {
                $expand: "Employee",
                $filter: "Period ge " + sCutoffDateString,
                $orderby: "Period desc, Employee/Department, Employee/Team"
            });

            console.log("Querying PerformanceMetrics with filter: Period ge", sCutoffDateString);

            // Request performance metrics contexts with time filtering
            oBinding.requestContexts().then(function (aContexts) {
                console.log("Successfully loaded " + aContexts.length + " performance metrics records within time range");

                // Log sample data for debugging
                if (aContexts.length > 0) {
                    var oSampleData = aContexts[0].getObject();
                    console.log("Sample PerformanceMetrics data:", {
                        period: oSampleData.Period,
                        completionRate: oSampleData.ObjectiveCompletionRate,
                        employeeDepartment: oSampleData.Employee ? oSampleData.Employee.Department : "No employee",
                        employeeTeam: oSampleData.Employee ? oSampleData.Employee.Team : "No team"
                    });
                }

                // Fetch aggregated data by department/team
                that._fetchAggregatedPerformanceData(aContexts);

            }).catch(function (oError) {
                console.error("Error loading performance analytics data:", oError);
                oPerformanceAnalyticsModel.setProperty("/summaryText", "Error loading performance data");
                MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("errorLoadingPerformanceData"));
            });
        },

        /**
         * Fetch and aggregate PerformanceMetrics by department/team
         * @param {Array} aContexts - Performance metrics contexts
         * @private
         */
        _fetchAggregatedPerformanceData: function (aContexts) {
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var sViewType = oPerformanceAnalyticsModel.getProperty("/viewType");

            console.log("Aggregating performance data by", sViewType);

            // Group and aggregate data by selected view type
            var oAggregatedData = this._aggregatePerformanceByViewType(aContexts, sViewType);

            // Bind aggregated data to charts
            this._bindDataToCharts(oAggregatedData);

            // Update summary KPIs
            this._updatePerformanceSummaryKPIs(oAggregatedData);

            // Update detailed table
            this._updatePerformanceTable(oAggregatedData);

            // Update summary text
            var sSummaryText = "Analyzed " + aContexts.length + " performance records across " +
                              Object.keys(oAggregatedData.aggregations).length + " " + sViewType + "s";
            oPerformanceAnalyticsModel.setProperty("/summaryText", sSummaryText);
            oPerformanceAnalyticsModel.setProperty("/lastUpdated", new Date().toLocaleDateString());

            console.log("Performance data aggregation completed");
        },

        /**
         * Process performance data for analytics visualization
         * @param {Array} aContexts - Performance metrics contexts
         * @private
         */
        _processPerformanceData: function (aContexts) {
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var sViewType = oPerformanceAnalyticsModel.getProperty("/viewType");
            var iTimeRange = parseInt(oPerformanceAnalyticsModel.getProperty("/timeRange"));
            
            console.log("Processing performance data for view type:", sViewType, "Time range:", iTimeRange, "months");
            
            // Filter data by time range
            var dCutoffDate = new Date();
            dCutoffDate.setMonth(dCutoffDate.getMonth() - iTimeRange);
            
            var aFilteredData = aContexts.filter(function (oContext) {
                var oPerformanceMetric = oContext.getObject();
                var dPeriodDate = new Date(oPerformanceMetric.Period);
                return dPeriodDate >= dCutoffDate;
            });
            
            console.log("Filtered to " + aFilteredData.length + " records within time range");
            
            // Process data based on view type
            var oProcessedData = this._aggregateDataByViewType(aFilteredData, sViewType);
            
            // Update chart data
            this._updateChartData(oProcessedData);
            
            // Update table data
            this._updateTableData(oProcessedData);
            
            // Update summary KPIs
            this._updateSummaryKPIs(oProcessedData);
            
            // Update summary text
            var sSummaryText = "Analyzed " + aFilteredData.length + " performance records across " + 
                              Object.keys(oProcessedData.categories).length + " " + sViewType + "s";
            oPerformanceAnalyticsModel.setProperty("/summaryText", sSummaryText);
            oPerformanceAnalyticsModel.setProperty("/lastUpdated", new Date().toLocaleDateString());
        },

        /**
         * Aggregate PerformanceMetrics by view type (department, team, or individual)
         * @param {Array} aContexts - Performance metrics contexts
         * @param {string} sViewType - View type (department, team, individual)
         * @returns {object} Aggregated performance data
         * @private
         */
        _aggregatePerformanceByViewType: function (aContexts, sViewType) {
            var oAggregatedData = {
                aggregations: {},
                periods: new Set(),
                totalRecords: aContexts.length,
                viewType: sViewType
            };

            console.log("Aggregating " + aContexts.length + " performance records by " + sViewType);

            aContexts.forEach(function (oContext) {
                var oPerformanceMetric = oContext.getObject();
                var oEmployee = oPerformanceMetric.Employee;

                if (!oEmployee) {
                    console.warn("Skipping performance metric without employee data");
                    return;
                }

                // Determine aggregation key based on view type
                var sAggregationKey;
                switch (sViewType) {
                    case "department":
                        sAggregationKey = oEmployee.Department || "Unknown Department";
                        break;
                    case "team":
                        sAggregationKey = (oEmployee.Department || "Unknown Dept") + " - " + (oEmployee.Team || "Unknown Team");
                        break;
                    case "individual":
                        sAggregationKey = (oEmployee.FirstName || "") + " " + (oEmployee.LastName || "Unknown Employee");
                        break;
                    default:
                        sAggregationKey = oEmployee.Department || "Unknown";
                }

                var sPeriod = this._formatPeriodForChart(oPerformanceMetric.Period);
                var fCompletionRate = parseFloat(oPerformanceMetric.ObjectiveCompletionRate) || 0;

                // Initialize aggregation group if not exists
                if (!oAggregatedData.aggregations[sAggregationKey]) {
                    oAggregatedData.aggregations[sAggregationKey] = {
                        name: sAggregationKey,
                        department: oEmployee.Department,
                        team: oEmployee.Team,
                        periods: {},
                        totalScore: 0,
                        totalRecords: 0,
                        employeeIds: new Set(),
                        averageScore: 0
                    };
                }

                // Initialize period if not exists
                if (!oAggregatedData.aggregations[sAggregationKey].periods[sPeriod]) {
                    oAggregatedData.aggregations[sAggregationKey].periods[sPeriod] = {
                        totalScore: 0,
                        recordCount: 0,
                        employeeIds: new Set(),
                        averageScore: 0
                    };
                }

                // Aggregate performance data
                var oAggregation = oAggregatedData.aggregations[sAggregationKey];
                var oPeriodData = oAggregation.periods[sPeriod];

                oPeriodData.totalScore += fCompletionRate;
                oPeriodData.recordCount++;
                oPeriodData.employeeIds.add(oEmployee.ID);
                oPeriodData.averageScore = Math.round(oPeriodData.totalScore / oPeriodData.recordCount);

                oAggregation.totalScore += fCompletionRate;
                oAggregation.totalRecords++;
                oAggregation.employeeIds.add(oEmployee.ID);
                oAggregation.averageScore = Math.round(oAggregation.totalScore / oAggregation.totalRecords);

                oAggregatedData.periods.add(sPeriod);
            }.bind(this));

            // Convert periods set to sorted array
            oAggregatedData.periods = Array.from(oAggregatedData.periods).sort();

            // Calculate additional metrics
            this._calculateAggregationMetrics(oAggregatedData);

            console.log("Performance aggregation completed:", {
                aggregationGroups: Object.keys(oAggregatedData.aggregations).length,
                periods: oAggregatedData.periods.length,
                totalRecords: oAggregatedData.totalRecords,
                viewType: sViewType
            });

            return oAggregatedData;
        },

        /**
         * Calculate additional metrics for aggregated data
         * @param {object} oAggregatedData - Aggregated data object
         * @private
         */
        _calculateAggregationMetrics: function (oAggregatedData) {
            Object.keys(oAggregatedData.aggregations).forEach(function (sKey) {
                var oAggregation = oAggregatedData.aggregations[sKey];

                // Calculate trend (compare latest two periods)
                var aPeriods = Object.keys(oAggregation.periods).sort();
                if (aPeriods.length >= 2) {
                    var sLatestPeriod = aPeriods[aPeriods.length - 1];
                    var sPreviousPeriod = aPeriods[aPeriods.length - 2];

                    var fLatestScore = oAggregation.periods[sLatestPeriod].averageScore;
                    var fPreviousScore = oAggregation.periods[sPreviousPeriod].averageScore;

                    oAggregation.trend = fLatestScore - fPreviousScore;
                    oAggregation.trendDirection = oAggregation.trend > 0 ? "up" :
                                                 oAggregation.trend < 0 ? "down" : "neutral";
                } else {
                    oAggregation.trend = 0;
                    oAggregation.trendDirection = "neutral";
                }

                // Calculate performance category
                if (oAggregation.averageScore >= 85) {
                    oAggregation.performanceCategory = "excellent";
                } else if (oAggregation.averageScore >= 70) {
                    oAggregation.performanceCategory = "good";
                } else if (oAggregation.averageScore >= 60) {
                    oAggregation.performanceCategory = "fair";
                } else {
                    oAggregation.performanceCategory = "poor";
                }

                // Convert employee IDs set to count
                oAggregation.employeeCount = oAggregation.employeeIds.size;
            });
        },

        /**
         * Format period for chart display (YYYY-MM format)
         * @param {string} sPeriod - Period string
         * @returns {string} Formatted period
         * @private
         */
        _formatPeriodForChart: function (sPeriod) {
            if (!sPeriod) {
                return "Unknown";
            }

            try {
                var dPeriod = new Date(sPeriod);
                var sYear = dPeriod.getFullYear().toString();
                var sMonth = (dPeriod.getMonth() + 1).toString().padStart(2, '0');

                return sYear + "-" + sMonth;
            } catch (oError) {
                console.warn("Error formatting period:", sPeriod, oError);
                return "Invalid Date";
            }
        },

        /**
         * Format period for display
         * @param {string} sPeriod - Period string
         * @returns {string} Formatted period
         * @private
         */
        _formatPeriod: function (sPeriod) {
            if (!sPeriod) {
                return "Unknown";
            }
            
            // Convert to date and format as YYYY-MM
            var dPeriod = new Date(sPeriod);
            var sYear = dPeriod.getFullYear().toString();
            var sMonth = (dPeriod.getMonth() + 1).toString().padStart(2, '0');
            
            return sYear + "-" + sMonth;
        },

        /**
         * Bind aggregated data to charts
         * @param {object} oAggregatedData - Aggregated performance data
         * @private
         */
        _bindDataToCharts: function (oAggregatedData) {
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var aChartData = [];
            var sViewType = oAggregatedData.viewType;

            console.log("Binding aggregated data to charts for view type:", sViewType);

            // Generate chart data from aggregated performance data
            oAggregatedData.periods.forEach(function (sPeriod) {
                Object.keys(oAggregatedData.aggregations).forEach(function (sAggregationKey) {
                    var oAggregation = oAggregatedData.aggregations[sAggregationKey];
                    var oPeriodData = oAggregation.periods[sPeriod];

                    if (oPeriodData && oPeriodData.recordCount > 0) {
                        aChartData.push({
                            Period: sPeriod,
                            Category: oAggregation.name,
                            CompletionRate: oPeriodData.averageScore,
                            Target: this._getTargetForCategory(oAggregation, sViewType),
                            EmployeeCount: oPeriodData.employeeIds.size,
                            Department: oAggregation.department,
                            Team: oAggregation.team,
                            RecordCount: oPeriodData.recordCount
                        });
                    }
                }.bind(this));
            }.bind(this));

            // Sort chart data by period and category for better visualization
            aChartData.sort(function (a, b) {
                if (a.Period !== b.Period) {
                    return a.Period.localeCompare(b.Period);
                }
                return a.Category.localeCompare(b.Category);
            });

            // Bind chart data to model
            oPerformanceAnalyticsModel.setProperty("/chartData", aChartData);

            // Update chart info
            var sChartInfo = "Showing " + aChartData.length + " data points across " +
                           oAggregatedData.periods.length + " periods for " +
                           Object.keys(oAggregatedData.aggregations).length + " " + sViewType + "s";
            oPerformanceAnalyticsModel.setProperty("/chartInfo", sChartInfo);

            // Update VizFrame properties based on data
            this._updateVizFrameProperties(oAggregatedData);

            console.log("Chart data binding completed:", {
                dataPoints: aChartData.length,
                periods: oAggregatedData.periods.length,
                aggregations: Object.keys(oAggregatedData.aggregations).length
            });
        },

        /**
         * Get performance target for category
         * @param {object} oAggregation - Aggregation data
         * @param {string} sViewType - View type
         * @returns {number} Target value
         * @private
         */
        _getTargetForCategory: function (oAggregation, sViewType) {
            // Set different targets based on view type and department
            switch (sViewType) {
                case "department":
                    // Higher targets for certain departments
                    if (oAggregation.department === "Engineering" || oAggregation.department === "Sales") {
                        return 85;
                    } else if (oAggregation.department === "Marketing" || oAggregation.department === "Human Resources") {
                        return 80;
                    }
                    return 75; // Default department target

                case "team":
                    // Team-specific targets
                    return 80;

                case "individual":
                    // Individual targets
                    return 75;

                default:
                    return 80;
            }
        },

        /**
         * Update VizFrame properties based on aggregated data
         * @param {object} oAggregatedData - Aggregated data
         * @private
         */
        _updateVizFrameProperties: function (oAggregatedData) {
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var sChartType = oPerformanceAnalyticsModel.getProperty("/chartType");
            var sViewType = oAggregatedData.viewType;

            var oVizProperties = this._getVizPropertiesForChartType(sChartType);

            // Update title based on view type and data
            var sTitle = this._getChartTitleForViewType(sViewType, Object.keys(oAggregatedData.aggregations).length);
            oVizProperties.title.text = sTitle;

            // Update axis labels
            oVizProperties.categoryAxis.title.text = "Time Period";
            oVizProperties.valueAxis.title.text = "Average Completion Rate (%)";

            // Set color palette based on number of categories
            var iCategoryCount = Object.keys(oAggregatedData.aggregations).length;
            if (iCategoryCount <= 5) {
                oVizProperties.plotArea.colorPalette = ["#5cbae6", "#b6d957", "#fac364", "#8cd3ff", "#d998cb"];
            } else if (iCategoryCount <= 10) {
                oVizProperties.plotArea.colorPalette = [
                    "#5cbae6", "#b6d957", "#fac364", "#8cd3ff", "#d998cb",
                    "#f998a5", "#81ca9d", "#6dcff6", "#bc5090", "#ff6b6b"
                ];
            } else {
                // Use default palette for many categories
                oVizProperties.plotArea.colorPalette = null;
            }

            oPerformanceAnalyticsModel.setProperty("/vizProperties", oVizProperties);
        },

        /**
         * Get chart title for view type
         * @param {string} sViewType - View type
         * @param {number} iCategoryCount - Number of categories
         * @returns {string} Chart title
         * @private
         */
        _getChartTitleForViewType: function (sViewType, iCategoryCount) {
            switch (sViewType) {
                case "department":
                    return "Department Performance Trends (" + iCategoryCount + " departments)";
                case "team":
                    return "Team Performance Trends (" + iCategoryCount + " teams)";
                case "individual":
                    return "Individual Performance Trends (" + iCategoryCount + " employees)";
                default:
                    return "Performance Trends";
            }
        },

        /**
         * Update performance table with aggregated data
         * @param {object} oAggregatedData - Aggregated performance data
         * @private
         */
        _updatePerformanceTable: function (oAggregatedData) {
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var aTableData = [];

            console.log("Updating performance table with aggregated data");

            Object.keys(oAggregatedData.aggregations).forEach(function (sAggregationKey) {
                var oAggregation = oAggregatedData.aggregations[sAggregationKey];
                var aPeriods = Object.keys(oAggregation.periods).sort();

                var oTableRow = {
                    Category: oAggregation.name,
                    Department: oAggregation.department,
                    Team: oAggregation.team,
                    EmployeeCount: oAggregation.employeeCount,
                    TotalRecords: oAggregation.totalRecords,
                    AverageScore: oAggregation.averageScore,
                    PerformanceCategory: oAggregation.performanceCategory,
                    TrendDirection: oAggregation.trendDirection,
                    CurrentPeriod: 0,
                    PreviousPeriod: 0,
                    Change: oAggregation.trend || 0
                };

                if (aPeriods.length >= 2) {
                    var sCurrentPeriod = aPeriods[aPeriods.length - 1];
                    var sPreviousPeriod = aPeriods[aPeriods.length - 2];

                    oTableRow.CurrentPeriod = oAggregation.periods[sCurrentPeriod].averageScore;
                    oTableRow.PreviousPeriod = oAggregation.periods[sPreviousPeriod].averageScore;
                    oTableRow.Change = oTableRow.CurrentPeriod - oTableRow.PreviousPeriod;
                } else if (aPeriods.length === 1) {
                    var sPeriod = aPeriods[0];
                    oTableRow.CurrentPeriod = oAggregation.periods[sPeriod].averageScore;
                    oTableRow.PreviousPeriod = 0;
                    oTableRow.Change = 0;
                } else {
                    // No period data available
                    oTableRow.CurrentPeriod = oAggregation.averageScore;
                    oTableRow.PreviousPeriod = 0;
                    oTableRow.Change = 0;
                }

                aTableData.push(oTableRow);
            });

            // Sort by current period performance (descending)
            aTableData.sort(function (a, b) {
                return b.CurrentPeriod - a.CurrentPeriod;
            });

            oPerformanceAnalyticsModel.setProperty("/tableData", aTableData);

            console.log("Performance table updated with " + aTableData.length + " rows");
        },

        /**
         * Update performance summary KPIs from aggregated data
         * @param {object} oAggregatedData - Aggregated performance data
         * @private
         */
        _updatePerformanceSummaryKPIs: function (oAggregatedData) {
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");

            console.log("Updating performance summary KPIs");

            // Calculate overall completion rate from aggregated data
            var iTotalScore = 0;
            var iTotalRecords = 0;
            var aPerformanceCategories = [];

            Object.keys(oAggregatedData.aggregations).forEach(function (sAggregationKey) {
                var oAggregation = oAggregatedData.aggregations[sAggregationKey];

                aPerformanceCategories.push({
                    name: oAggregation.name,
                    score: oAggregation.averageScore,
                    employeeCount: oAggregation.employeeCount,
                    trend: oAggregation.trend,
                    trendDirection: oAggregation.trendDirection,
                    performanceCategory: oAggregation.performanceCategory,
                    department: oAggregation.department,
                    team: oAggregation.team
                });

                iTotalScore += oAggregation.totalScore;
                iTotalRecords += oAggregation.totalRecords;
            });

            var fOverallCompletionRate = iTotalRecords > 0 ?
                Math.round(iTotalScore / iTotalRecords) : 0;

            // Sort categories by score (descending)
            aPerformanceCategories.sort(function (a, b) {
                return b.score - a.score;
            });

            // Calculate overall trend based on individual trends
            var iTrendUpCount = 0;
            var iTrendDownCount = 0;
            var iTotalTrend = 0;

            aPerformanceCategories.forEach(function (oCategory) {
                if (oCategory.trendDirection === "up") {
                    iTrendUpCount++;
                } else if (oCategory.trendDirection === "down") {
                    iTrendDownCount++;
                }
                iTotalTrend += oCategory.trend || 0;
            });

            var fAverageTrend = aPerformanceCategories.length > 0 ?
                iTotalTrend / aPerformanceCategories.length : 0;

            // Determine overall trend and text
            var sOverallTrend = "neutral";
            var sOverallTrendText = "Stable performance";

            if (fAverageTrend > 2) {
                sOverallTrend = "up";
                sOverallTrendText = "Improving performance (" + iTrendUpCount + " improving)";
            } else if (fAverageTrend < -2) {
                sOverallTrend = "down";
                sOverallTrendText = "Declining performance (" + iTrendDownCount + " declining)";
            } else if (fOverallCompletionRate >= 85) {
                sOverallTrend = "up";
                sOverallTrendText = "Excellent performance";
            } else if (fOverallCompletionRate >= 70) {
                sOverallTrend = "neutral";
                sOverallTrendText = "Good performance";
            } else {
                sOverallTrend = "down";
                sOverallTrendText = "Needs improvement";
            }

            // Update model with calculated KPIs
            oPerformanceAnalyticsModel.setProperty("/overallCompletionRate", fOverallCompletionRate);
            oPerformanceAnalyticsModel.setProperty("/overallTrend", sOverallTrend);
            oPerformanceAnalyticsModel.setProperty("/overallTrendText", sOverallTrendText);

            // Top performing category
            if (aPerformanceCategories.length > 0) {
                var oTopPerformer = aPerformanceCategories[0];
                oPerformanceAnalyticsModel.setProperty("/topDepartment", {
                    name: oTopPerformer.name,
                    score: oTopPerformer.score,
                    employeeCount: oTopPerformer.employeeCount,
                    trend: oTopPerformer.trend
                });

                // Category needing improvement (lowest score)
                var oImprovementCategory = aPerformanceCategories[aPerformanceCategories.length - 1];
                oPerformanceAnalyticsModel.setProperty("/improvementDepartment", {
                    name: oImprovementCategory.name,
                    score: oImprovementCategory.score,
                    employeeCount: oImprovementCategory.employeeCount,
                    trend: oImprovementCategory.trend
                });
            }

            console.log("Performance summary KPIs updated:", {
                overallRate: fOverallCompletionRate,
                trend: sOverallTrend,
                trendDirection: fAverageTrend,
                categories: aPerformanceCategories.length,
                topPerformer: aPerformanceCategories.length > 0 ? aPerformanceCategories[0].name : "None"
            });
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
         * Handle time range change with enhanced period selection support
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onTimeRangeChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var sPreviousTimeRange = oPerformanceAnalyticsModel.getProperty("/timeRange");

            console.log("Time range changed from", sPreviousTimeRange, "to", sSelectedKey, "months");

            // Update time range in model
            oPerformanceAnalyticsModel.setProperty("/timeRange", sSelectedKey);

            // Show loading state
            oPerformanceAnalyticsModel.setProperty("/summaryText", "Loading data for " + sSelectedKey + " months...");

            // Reload performance data with new time period
            this._loadPerformanceData();

            // Show confirmation message
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var sMessage = oResourceBundle.getText("timeRangeChanged") + " " + sSelectedKey + " " +
                          oResourceBundle.getText("months");
            MessageToast.show(sMessage);
        },

        /**
         * Get time period filter for OData query
         * @param {number} iMonths - Number of months to go back
         * @returns {object} Filter configuration
         * @private
         */
        _getTimePeriodFilter: function (iMonths) {
            var dCutoffDate = new Date();
            dCutoffDate.setMonth(dCutoffDate.getMonth() - iMonths);

            // Format date for OData filter (ISO format)
            var sCutoffDateString = dCutoffDate.toISOString();

            console.log("Time period filter: Period ge", sCutoffDateString, "(" + iMonths + " months back)");

            return {
                cutoffDate: dCutoffDate,
                cutoffDateString: sCutoffDateString,
                filterExpression: "Period ge " + sCutoffDateString,
                months: iMonths
            };
        },

        /**
         * Support for custom time period selection
         * @param {Date} dStartDate - Start date
         * @param {Date} dEndDate - End date
         * @private
         */
        _loadPerformanceDataForCustomPeriod: function (dStartDate, dEndDate) {
            var oModel = this.getView().getModel();
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var that = this;

            console.log("Loading performance data for custom period:", dStartDate, "to", dEndDate);

            var sStartDateString = dStartDate.toISOString();
            var sEndDateString = dEndDate.toISOString();
            var sCustomFilter = "Period ge " + sStartDateString + " and Period le " + sEndDateString;

            // Query with custom date range
            var oBinding = oModel.bindList("/PerformanceMetrics", null, null, null, {
                $expand: "Employee",
                $filter: sCustomFilter,
                $orderby: "Period desc, Employee/Department, Employee/Team"
            });

            oBinding.requestContexts().then(function (aContexts) {
                console.log("Loaded " + aContexts.length + " records for custom period");
                that._fetchAggregatedPerformanceData(aContexts);
            }).catch(function (oError) {
                console.error("Error loading custom period data:", oError);
                MessageToast.show("Error loading data for custom period");
            });
        },

        /**
         * Handle view type change with enhanced aggregation support
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onViewTypeChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("key");
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");
            var sPreviousViewType = oPerformanceAnalyticsModel.getProperty("/viewType");

            console.log("View type changed from", sPreviousViewType, "to", sSelectedKey);

            // Update view type in model
            oPerformanceAnalyticsModel.setProperty("/viewType", sSelectedKey);

            // Show loading state
            oPerformanceAnalyticsModel.setProperty("/summaryText", "Aggregating data by " + sSelectedKey + "...");

            // Reload performance data with new aggregation view
            this._loadPerformanceData();

            // Update chart title immediately
            var sNewTitle = this._getChartTitleForViewType(sSelectedKey, 0);
            var oVizProperties = oPerformanceAnalyticsModel.getProperty("/vizProperties");
            oVizProperties.title.text = sNewTitle;
            oPerformanceAnalyticsModel.setProperty("/vizProperties", oVizProperties);

            // Show confirmation message
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var sMessage = oResourceBundle.getText("viewTypeChanged") + " " +
                          this._getViewTypeDisplayName(sSelectedKey);
            MessageToast.show(sMessage);
        },

        /**
         * Get display name for view type
         * @param {string} sViewType - View type key
         * @returns {string} Display name
         * @private
         */
        _getViewTypeDisplayName: function (sViewType) {
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            switch (sViewType) {
                case "department":
                    return oResourceBundle.getText("byDepartment");
                case "team":
                    return oResourceBundle.getText("byTeam");
                case "individual":
                    return oResourceBundle.getText("byIndividual");
                default:
                    return sViewType;
            }
        },

        /**
         * Handle chart type change
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onChartTypeChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("key");
            var oPerformanceAnalyticsModel = this.getView().getModel("performanceAnalytics");

            oPerformanceAnalyticsModel.setProperty("/chartType", sSelectedKey);

            // Update viz properties based on chart type
            var oVizProperties = this._getVizPropertiesForChartType(sSelectedKey);
            oPerformanceAnalyticsModel.setProperty("/vizProperties", oVizProperties);

            MessageToast.show("Chart type changed to " + sSelectedKey);
        },

        /**
         * Get viz properties for specific chart type
         * @param {string} sChartType - Chart type
         * @returns {object} Viz properties
         * @private
         */
        _getVizPropertiesForChartType: function (sChartType) {
            var oBaseProperties = this._getDefaultVizProperties();

            switch (sChartType) {
                case "line":
                    oBaseProperties.title.text = "Performance Trends (Line Chart)";
                    break;
                case "column":
                    oBaseProperties.title.text = "Performance Comparison (Bar Chart)";
                    oBaseProperties.plotArea.dataLabel.visible = true;
                    break;
                case "combination":
                    oBaseProperties.title.text = "Performance vs Target (Combination Chart)";
                    oBaseProperties.plotArea.dataLabel.visible = true;
                    break;
                default:
                    oBaseProperties.title.text = "Performance Analytics";
            }

            return oBaseProperties;
        },

        /**
         * Handle chart data selection
         * @param {sap.ui.base.Event} oEvent - Select data event
         */
        onChartSelectData: function (oEvent) {
            var aSelectedData = oEvent.getParameter("data");
            if (aSelectedData && aSelectedData.length > 0) {
                var oSelectedPoint = aSelectedData[0].data;
                var sMessage = "Selected: " + oSelectedPoint.Category + " - " +
                              oSelectedPoint.Period + " (" + oSelectedPoint["Completion Rate"] + "%)";
                MessageToast.show(sMessage);
            }
        },

        /**
         * Refresh analytics data
         */
        onRefreshAnalytics: function () {
            this._loadPerformanceData();
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("analyticsRefreshed"));
        },

        /**
         * Export analytics data
         */
        onExportAnalytics: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Export table data
         */
        onExportTable: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Full screen chart view
         */
        onFullScreenChart: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Download chart
         */
        onDownloadChart: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Generate report
         */
        onGenerateReport: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Schedule report
         */
        onScheduleReport: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        // Formatter Methods

        /**
         * Format chart title based on view type
         * @param {string} sViewType - View type
         * @returns {string} Chart title
         */
        formatChartTitle: function (sViewType) {
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            switch (sViewType) {
                case "department":
                    return oResourceBundle.getText("departmentPerformanceTrends");
                case "team":
                    return oResourceBundle.getText("teamPerformanceTrends");
                case "individual":
                    return oResourceBundle.getText("individualPerformanceTrends");
                default:
                    return oResourceBundle.getText("performanceTrends");
            }
        },

        /**
         * Format category column header based on view type
         * @param {string} sViewType - View type
         * @returns {string} Column header
         */
        formatCategoryColumnHeader: function (sViewType) {
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            switch (sViewType) {
                case "department":
                    return oResourceBundle.getText("department");
                case "team":
                    return oResourceBundle.getText("team");
                case "individual":
                    return oResourceBundle.getText("employee");
                default:
                    return oResourceBundle.getText("category");
            }
        },

        /**
         * Format performance state for ObjectNumber
         * @param {number} iPerformance - Performance value
         * @returns {string} State
         */
        formatPerformanceState: function (iPerformance) {
            if (iPerformance >= 85) {
                return "Success";
            } else if (iPerformance >= 70) {
                return "Warning";
            } else {
                return "Error";
            }
        },

        /**
         * Format change state for ObjectNumber
         * @param {number} iChange - Change value
         * @returns {string} State
         */
        formatChangeState: function (iChange) {
            if (iChange > 0) {
                return "Success";
            } else if (iChange < 0) {
                return "Error";
            } else {
                return "None";
            }
        },

        /**
         * Format trend icon
         * @param {number} iValue - Trend value
         * @returns {string} Icon source
         */
        formatTrendIcon: function (iValue) {
            if (iValue > 0) {
                return "sap-icon://trend-up";
            } else if (iValue < 0) {
                return "sap-icon://trend-down";
            } else {
                return "sap-icon://neutral";
            }
        },

        /**
         * Format trend color
         * @param {number} iValue - Trend value
         * @returns {string} Color
         */
        formatTrendColor: function (iValue) {
            if (iValue > 0) {
                return "#2ECC71"; // Green
            } else if (iValue < 0) {
                return "#E74C3C"; // Red
            } else {
                return "#666666"; // Gray
            }
        },

        /**
         * Format trend text
         * @param {number} iValue - Trend value
         * @returns {string} Trend text
         */
        formatTrendText: function (iValue) {
            if (iValue > 0) {
                return "Improving";
            } else if (iValue < 0) {
                return "Declining";
            } else {
                return "Stable";
            }
        }
    });
});
