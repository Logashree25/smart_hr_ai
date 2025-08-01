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

    return Controller.extend("smart.hr.portal.controller.HiringNeeds", {

        /**
         * Called when the controller is instantiated.
         */
        onInit: function () {
            // Get router and attach route matched handler
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("RouteHiringNeeds").attachPatternMatched(this._onRouteMatched, this);
            
            // Initialize local models
            this._initializeModels();
            
            // Load hiring needs data
            this._loadHiringNeedsData();
        },

        /**
         * Initialize local models for hiring needs
         * @private
         */
        _initializeModels: function () {
            // Create hiring needs model for local state
            var oHiringNeedsModel = new JSONModel({
                totalPositions: 0,
                urgentPositions: 0,
                activeRecruiting: 0,
                summaryText: "Loading hiring data...",
                footerSummaryText: "Loading...",
                filters: {
                    department: "",
                    status: "",
                    priority: "",
                    searchQuery: ""
                },
                departments: [],
                selectedPositions: []
            });
            
            this.getView().setModel(oHiringNeedsModel, "hiringNeeds");
        },

        /**
         * Route matched handler
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            // Refresh hiring needs data when route is matched
            this._loadHiringNeedsData();
        },

        /**
         * Load OpenPositions data with enhanced sorting and filtering support
         * @private
         */
        _loadOpenPositions: function () {
            var oModel = this.getView().getModel(); // HR Service OData model
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");
            var that = this;

            console.log("Loading OpenPositions entity with sorting and filtering support...");

            // Set loading state
            oHiringNeedsModel.setProperty("/summaryText", "Loading open positions...");
            oHiringNeedsModel.setProperty("/footerSummaryText", "Loading hiring data...");

            // Query OpenPositions entity with comprehensive ordering
            var oBinding = oModel.bindList("/OpenPositions", null, null, null, {
                $orderby: "Level desc, Department asc, RequiredBy asc, Role asc"
            });

            console.log("Querying OpenPositions with default sorting: Level desc, Department asc, RequiredBy asc");

            // Request all open positions contexts
            oBinding.requestContexts().then(function (aContexts) {
                console.log("Successfully loaded " + aContexts.length + " open positions from OpenPositions entity");

                // Log sample data structure for debugging
                if (aContexts.length > 0) {
                    var oSampleData = aContexts[0].getObject();
                    console.log("Sample OpenPositions data structure:", {
                        id: oSampleData.ID,
                        role: oSampleData.Role,
                        department: oSampleData.Department,
                        level: oSampleData.Level,
                        status: oSampleData.Status,
                        requiredBy: oSampleData.RequiredBy
                    });
                }

                // Process and categorize hiring needs data
                that._processOpenPositionsData(aContexts);

                // Extract departments and levels for filtering
                that._extractFilterOptions(aContexts);

                // Initialize table sorting
                that._initializeTableSorting();

            }).catch(function (oError) {
                console.error("Error loading OpenPositions data:", oError);
                oHiringNeedsModel.setProperty("/summaryText", "Error loading hiring data");
                oHiringNeedsModel.setProperty("/footerSummaryText", "Error loading data");
                MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("errorLoadingHiringData"));
            });
        },

        /**
         * Load hiring needs data (wrapper for backward compatibility)
         * @private
         */
        _loadHiringNeedsData: function () {
            this._loadOpenPositions();
        },

        /**
         * Process and categorize OpenPositions data with enhanced analytics
         * @param {Array} aContexts - Open positions contexts
         * @private
         */
        _processOpenPositionsData: function (aContexts) {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");
            var iTotalPositions = aContexts.length;
            var iUrgentPositions = 0;
            var iActiveRecruiting = 0;
            var iHighPriority = 0;
            var iMediumPriority = 0;
            var iLowPriority = 0;
            var iOverdue = 0;
            var iOnHold = 0;
            var oDepartmentStats = {};
            var oLevelStats = {};

            console.log("Processing " + iTotalPositions + " OpenPositions records");

            aContexts.forEach(function (oContext) {
                var oPosition = oContext.getObject();

                // Count by priority level
                switch (oPosition.Level) {
                    case "Urgent":
                        iUrgentPositions++;
                        break;
                    case "High":
                        iHighPriority++;
                        break;
                    case "Medium":
                        iMediumPriority++;
                        break;
                    case "Low":
                        iLowPriority++;
                        break;
                }

                // Count by status
                switch (oPosition.Status) {
                    case "Active":
                        iActiveRecruiting++;
                        break;
                    case "On Hold":
                        iOnHold++;
                        break;
                }

                // Count overdue positions
                if (oPosition.RequiredBy) {
                    var dRequiredBy = new Date(oPosition.RequiredBy);
                    var dToday = new Date();
                    if (dRequiredBy < dToday && oPosition.Status === "Active") {
                        iOverdue++;
                    }
                }

                // Department statistics
                var sDepartment = oPosition.Department || "Unknown";
                if (!oDepartmentStats[sDepartment]) {
                    oDepartmentStats[sDepartment] = {
                        total: 0,
                        urgent: 0,
                        active: 0,
                        overdue: 0
                    };
                }
                oDepartmentStats[sDepartment].total++;
                if (oPosition.Level === "Urgent") {
                    oDepartmentStats[sDepartment].urgent++;
                }
                if (oPosition.Status === "Active") {
                    oDepartmentStats[sDepartment].active++;
                }
                if (oPosition.RequiredBy) {
                    var dReqBy = new Date(oPosition.RequiredBy);
                    var dNow = new Date();
                    if (dReqBy < dNow && oPosition.Status === "Active") {
                        oDepartmentStats[sDepartment].overdue++;
                    }
                }

                // Level statistics
                var sLevel = oPosition.Level || "Unknown";
                if (!oLevelStats[sLevel]) {
                    oLevelStats[sLevel] = 0;
                }
                oLevelStats[sLevel]++;
            });

            // Update summary counts
            oHiringNeedsModel.setProperty("/totalPositions", iTotalPositions);
            oHiringNeedsModel.setProperty("/urgentPositions", iUrgentPositions);
            oHiringNeedsModel.setProperty("/activeRecruiting", iActiveRecruiting);

            // Store detailed statistics
            oHiringNeedsModel.setProperty("/departmentStats", oDepartmentStats);
            oHiringNeedsModel.setProperty("/levelStats", oLevelStats);

            // Update summary text with enhanced information
            var sSummaryText = iTotalPositions + " open positions";
            if (iUrgentPositions > 0) {
                sSummaryText += " (" + iUrgentPositions + " urgent)";
            }
            oHiringNeedsModel.setProperty("/summaryText", sSummaryText);

            // Update comprehensive footer summary
            var sFooterText = "Total: " + iTotalPositions + " | " +
                            "Active: " + iActiveRecruiting + " | " +
                            "Urgent: " + iUrgentPositions + " | " +
                            "High: " + iHighPriority + " | " +
                            "Medium: " + iMediumPriority + " | " +
                            "Low: " + iLowPriority;
            if (iOverdue > 0) {
                sFooterText += " | Overdue: " + iOverdue;
            }
            if (iOnHold > 0) {
                sFooterText += " | On Hold: " + iOnHold;
            }
            oHiringNeedsModel.setProperty("/footerSummaryText", sFooterText);

            console.log("OpenPositions data processed:", {
                total: iTotalPositions,
                urgent: iUrgentPositions,
                high: iHighPriority,
                medium: iMediumPriority,
                low: iLowPriority,
                active: iActiveRecruiting,
                overdue: iOverdue,
                departments: Object.keys(oDepartmentStats).length,
                levels: Object.keys(oLevelStats)
            });
        },

        /**
         * Process and categorize hiring needs data (wrapper for backward compatibility)
         * @param {Array} aContexts - Open positions contexts
         * @private
         */
        _processHiringNeedsData: function (aContexts) {
            this._processOpenPositionsData(aContexts);
        },

        /**
         * Extract filter options (departments and levels) from OpenPositions data
         * @param {Array} aContexts - Open positions contexts
         * @private
         */
        _extractFilterOptions: function (aContexts) {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");
            var aDepartments = [""];  // Start with empty option for "All Departments"
            var aLevels = [""];       // Start with empty option for "All Levels"
            var aStatuses = [""];     // Start with empty option for "All Statuses"

            console.log("Extracting filter options from " + aContexts.length + " OpenPositions records");

            aContexts.forEach(function (oContext) {
                var oPosition = oContext.getObject();

                // Extract unique departments
                if (oPosition.Department) {
                    var sDepartment = oPosition.Department;
                    if (aDepartments.indexOf(sDepartment) === -1) {
                        aDepartments.push(sDepartment);
                    }
                }

                // Extract unique priority levels
                if (oPosition.Level) {
                    var sLevel = oPosition.Level;
                    if (aLevels.indexOf(sLevel) === -1) {
                        aLevels.push(sLevel);
                    }
                }

                // Extract unique statuses
                if (oPosition.Status) {
                    var sStatus = oPosition.Status;
                    if (aStatuses.indexOf(sStatus) === -1) {
                        aStatuses.push(sStatus);
                    }
                }
            });

            // Sort departments (keeping empty option first)
            aDepartments.sort(function(a, b) {
                if (a === "") return -1;
                if (b === "") return 1;
                return a.localeCompare(b);
            });

            // Sort levels by priority (keeping empty option first)
            aLevels.sort(function(a, b) {
                if (a === "") return -1;
                if (b === "") return 1;

                var aPriorityOrder = ["Urgent", "High", "Medium", "Low"];
                var iIndexA = aPriorityOrder.indexOf(a);
                var iIndexB = aPriorityOrder.indexOf(b);

                if (iIndexA === -1) iIndexA = 999;
                if (iIndexB === -1) iIndexB = 999;

                return iIndexA - iIndexB;
            });

            // Sort statuses (keeping empty option first)
            aStatuses.sort(function(a, b) {
                if (a === "") return -1;
                if (b === "") return 1;

                var aStatusOrder = ["Active", "On Hold", "Filled", "Cancelled"];
                var iIndexA = aStatusOrder.indexOf(a);
                var iIndexB = aStatusOrder.indexOf(b);

                if (iIndexA === -1) iIndexA = 999;
                if (iIndexB === -1) iIndexB = 999;

                return iIndexA - iIndexB;
            });

            // Update model with filter options
            oHiringNeedsModel.setProperty("/departments", aDepartments);
            oHiringNeedsModel.setProperty("/levels", aLevels);
            oHiringNeedsModel.setProperty("/statuses", aStatuses);

            console.log("Filter options extracted:", {
                departments: aDepartments.length - 1,
                levels: aLevels.length - 1,
                statuses: aStatuses.length - 1,
                departmentList: aDepartments.slice(1),
                levelList: aLevels.slice(1)
            });
        },

        /**
         * Extract unique departments for filtering (wrapper for backward compatibility)
         * @param {Array} aContexts - Open positions contexts
         * @private
         */
        _extractDepartments: function (aContexts) {
            this._extractFilterOptions(aContexts);
        },

        /**
         * Initialize table sorting with Level and Department support
         * @private
         */
        _initializeTableSorting: function () {
            var oTable = this.byId("openPositionsTable");
            if (!oTable) {
                console.warn("Table not found for sorting initialization");
                return;
            }

            console.log("Initializing table sorting for Level and Department");

            // Set default sorting: Level (descending), Department (ascending), RequiredBy (ascending)
            var aSorters = [
                new Sorter("Level", true, false), // Descending priority (Urgent first)
                new Sorter("Department", false, false), // Ascending department
                new Sorter("RequiredBy", false, false) // Ascending date (earliest first)
            ];

            // Apply default sorting to table binding
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.sort(aSorters);
                console.log("Default sorting applied: Level desc, Department asc, RequiredBy asc");
            }
        },

        /**
         * Sort table by Level (priority)
         * @param {boolean} bDescending - Sort descending if true
         */
        sortByLevel: function (bDescending) {
            var oTable = this.byId("openPositionsTable");
            var oBinding = oTable.getBinding("items");

            if (!oBinding) {
                console.warn("No table binding found for Level sorting");
                return;
            }

            console.log("Sorting by Level:", bDescending ? "descending" : "ascending");

            // Create custom sorter for Level with priority order
            var oLevelSorter = new Sorter("Level", bDescending, false);

            // Custom comparator for priority levels
            oLevelSorter.fnCompare = function (sValue1, sValue2) {
                var aPriorityOrder = ["Urgent", "High", "Medium", "Low"];
                var iIndex1 = aPriorityOrder.indexOf(sValue1);
                var iIndex2 = aPriorityOrder.indexOf(sValue2);

                // Handle unknown levels
                if (iIndex1 === -1) iIndex1 = 999;
                if (iIndex2 === -1) iIndex2 = 999;

                if (bDescending) {
                    return iIndex1 - iIndex2; // Urgent first when descending
                } else {
                    return iIndex2 - iIndex1; // Low first when ascending
                }
            };

            // Apply sorting with secondary sort by Department
            var aSorters = [
                oLevelSorter,
                new Sorter("Department", false, false),
                new Sorter("RequiredBy", false, false)
            ];

            oBinding.sort(aSorters);

            var sMessage = "Sorted by Level " + (bDescending ? "(Urgent first)" : "(Low first)");
            MessageToast.show(sMessage);
        },

        /**
         * Sort table by Department
         * @param {boolean} bDescending - Sort descending if true
         */
        sortByDepartment: function (bDescending) {
            var oTable = this.byId("openPositionsTable");
            var oBinding = oTable.getBinding("items");

            if (!oBinding) {
                console.warn("No table binding found for Department sorting");
                return;
            }

            console.log("Sorting by Department:", bDescending ? "descending" : "ascending");

            // Apply sorting with secondary sort by Level
            var aSorters = [
                new Sorter("Department", bDescending, false),
                new Sorter("Level", true, false), // Keep Level as secondary sort (Urgent first)
                new Sorter("RequiredBy", false, false)
            ];

            oBinding.sort(aSorters);

            var sMessage = "Sorted by Department " + (bDescending ? "(Z-A)" : "(A-Z)");
            MessageToast.show(sMessage);
        },

        /**
         * Apply combined sorting by Level and Department
         * @param {string} sLevelOrder - "asc" or "desc" for Level
         * @param {string} sDepartmentOrder - "asc" or "desc" for Department
         */
        applyCombinedSorting: function (sLevelOrder, sDepartmentOrder) {
            var oTable = this.byId("openPositionsTable");
            var oBinding = oTable.getBinding("items");

            if (!oBinding) {
                console.warn("No table binding found for combined sorting");
                return;
            }

            console.log("Applying combined sorting - Level:", sLevelOrder, "Department:", sDepartmentOrder);

            var bLevelDesc = sLevelOrder === "desc";
            var bDepartmentDesc = sDepartmentOrder === "desc";

            // Create Level sorter with custom comparator
            var oLevelSorter = new Sorter("Level", bLevelDesc, false);
            oLevelSorter.fnCompare = function (sValue1, sValue2) {
                var aPriorityOrder = ["Urgent", "High", "Medium", "Low"];
                var iIndex1 = aPriorityOrder.indexOf(sValue1);
                var iIndex2 = aPriorityOrder.indexOf(sValue2);

                if (iIndex1 === -1) iIndex1 = 999;
                if (iIndex2 === -1) iIndex2 = 999;

                if (bLevelDesc) {
                    return iIndex1 - iIndex2;
                } else {
                    return iIndex2 - iIndex1;
                }
            };

            // Apply combined sorting
            var aSorters = [
                oLevelSorter,
                new Sorter("Department", bDepartmentDesc, false),
                new Sorter("RequiredBy", false, false)
            ];

            oBinding.sort(aSorters);

            var sMessage = "Sorted by Level (" + sLevelOrder + ") and Department (" + sDepartmentOrder + ")";
            MessageToast.show(sMessage);
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
         * Handle search positions
         * @param {sap.ui.base.Event} oEvent - Search event
         */
        onSearchPositions: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            this.getView().getModel("hiringNeeds").setProperty("/filters/searchQuery", sQuery);
            this._applyFilters();
        },

        /**
         * Handle department filter change
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onDepartmentFilterChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("hiringNeeds").setProperty("/filters/department", sSelectedKey);
            this._applyFilters();
        },

        /**
         * Handle status filter change
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onStatusFilterChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("hiringNeeds").setProperty("/filters/status", sSelectedKey);
            this._applyFilters();
        },

        /**
         * Handle priority filter change
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onPriorityFilterChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("hiringNeeds").setProperty("/filters/priority", sSelectedKey);
            this._applyFilters();
        },

        /**
         * Clear all filters
         */
        onClearHiringFilters: function () {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");
            
            // Clear filter values
            oHiringNeedsModel.setProperty("/filters/department", "");
            oHiringNeedsModel.setProperty("/filters/status", "");
            oHiringNeedsModel.setProperty("/filters/priority", "");
            oHiringNeedsModel.setProperty("/filters/searchQuery", "");
            
            // Reset UI controls
            this.byId("departmentHiringFilter").setSelectedKey("");
            this.byId("statusHiringFilter").setSelectedKey("");
            this.byId("priorityHiringFilter").setSelectedKey("");
            this.byId("hiringSearchField").setValue("");
            
            // Apply empty filters
            this._applyFilters();
            
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("filtersCleared"));
        },

        /**
         * Apply enhanced filters to the OpenPositions table with Level and Department support
         * @private
         */
        _applyFilters: function () {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");
            var sSearchQuery = oHiringNeedsModel.getProperty("/filters/searchQuery");
            var sDepartment = oHiringNeedsModel.getProperty("/filters/department");
            var sStatus = oHiringNeedsModel.getProperty("/filters/status");
            var sPriority = oHiringNeedsModel.getProperty("/filters/priority");

            var aFilters = [];

            console.log("Applying filters to OpenPositions table:", {
                search: sSearchQuery,
                department: sDepartment,
                status: sStatus,
                level: sPriority
            });

            // Add comprehensive search filter
            if (sSearchQuery && sSearchQuery.length > 0) {
                var oSearchFilter = new Filter([
                    new Filter("Role", FilterOperator.Contains, sSearchQuery),
                    new Filter("Department", FilterOperator.Contains, sSearchQuery),
                    new Filter("Location", FilterOperator.Contains, sSearchQuery),
                    new Filter("Team", FilterOperator.Contains, sSearchQuery),
                    new Filter("ExperienceLevel", FilterOperator.Contains, sSearchQuery)
                ], false);
                aFilters.push(oSearchFilter);
            }

            // Add Department filter (exact match)
            if (sDepartment && sDepartment.length > 0) {
                aFilters.push(new Filter("Department", FilterOperator.EQ, sDepartment));
            }

            // Add Status filter (exact match)
            if (sStatus && sStatus.length > 0) {
                aFilters.push(new Filter("Status", FilterOperator.EQ, sStatus));
            }

            // Add Level (Priority) filter (exact match)
            if (sPriority && sPriority.length > 0) {
                aFilters.push(new Filter("Level", FilterOperator.EQ, sPriority));
            }

            // Apply filters to table binding
            var oTable = this.byId("openPositionsTable");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.filter(aFilters);

                // Update summary text with filter results
                this._updateFilteredSummary(oBinding);
            }

            console.log("Filters applied to OpenPositions:", {
                search: sSearchQuery,
                department: sDepartment,
                status: sStatus,
                level: sPriority,
                totalFilters: aFilters.length
            });
        },

        /**
         * Filter by Level (Priority) only
         * @param {string} sLevel - Priority level to filter by
         */
        filterByLevel: function (sLevel) {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");

            console.log("Filtering by Level:", sLevel);

            // Update filter model
            oHiringNeedsModel.setProperty("/filters/priority", sLevel);

            // Update UI control
            this.byId("priorityHiringFilter").setSelectedKey(sLevel);

            // Apply filters
            this._applyFilters();

            var sMessage = sLevel ? "Filtered by Level: " + sLevel : "Level filter cleared";
            MessageToast.show(sMessage);
        },

        /**
         * Filter by Department only
         * @param {string} sDepartment - Department to filter by
         */
        filterByDepartment: function (sDepartment) {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");

            console.log("Filtering by Department:", sDepartment);

            // Update filter model
            oHiringNeedsModel.setProperty("/filters/department", sDepartment);

            // Update UI control
            this.byId("departmentHiringFilter").setSelectedKey(sDepartment);

            // Apply filters
            this._applyFilters();

            var sMessage = sDepartment ? "Filtered by Department: " + sDepartment : "Department filter cleared";
            MessageToast.show(sMessage);
        },

        /**
         * Apply combined filtering by Level and Department
         * @param {string} sLevel - Priority level
         * @param {string} sDepartment - Department
         */
        applyCombinedFiltering: function (sLevel, sDepartment) {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");

            console.log("Applying combined filtering - Level:", sLevel, "Department:", sDepartment);

            // Update filter model
            oHiringNeedsModel.setProperty("/filters/priority", sLevel);
            oHiringNeedsModel.setProperty("/filters/department", sDepartment);

            // Update UI controls
            this.byId("priorityHiringFilter").setSelectedKey(sLevel);
            this.byId("departmentHiringFilter").setSelectedKey(sDepartment);

            // Apply filters
            this._applyFilters();

            var sMessage = "Filtered by";
            if (sLevel) sMessage += " Level: " + sLevel;
            if (sDepartment) sMessage += " Department: " + sDepartment;
            if (!sLevel && !sDepartment) sMessage = "All filters cleared";

            MessageToast.show(sMessage);
        },

        /**
         * Update summary text based on filtered results
         * @param {sap.ui.model.ListBinding} oBinding - Table binding
         * @private
         */
        _updateFilteredSummary: function (oBinding) {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");

            // Get filtered contexts
            oBinding.getContexts().then(function (aFilteredContexts) {
                var iFilteredCount = aFilteredContexts.length;
                var iTotalCount = oHiringNeedsModel.getProperty("/totalPositions");

                var sSummaryText;
                if (iFilteredCount === iTotalCount) {
                    sSummaryText = iTotalCount + " open positions";
                } else {
                    sSummaryText = iFilteredCount + " of " + iTotalCount + " open positions";
                }

                oHiringNeedsModel.setProperty("/summaryText", sSummaryText);

                console.log("Filtered summary updated:", {
                    filtered: iFilteredCount,
                    total: iTotalCount
                });
            });
        },

        /**
         * Handle position press (navigate to detail)
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onPositionPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sPositionId = oContext.getProperty("ID");

            console.log("Position pressed:", sPositionId);
            MessageToast.show("Position details for ID: " + sPositionId);
        },

        /**
         * View position details
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onViewPosition: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sPositionId = oContext.getProperty("ID");
            var sRole = oContext.getProperty("Role");

            console.log("View position:", sPositionId, sRole);
            MessageToast.show("Viewing position: " + sRole);
        },

        /**
         * Edit position
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onEditPosition: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sPositionId = oContext.getProperty("ID");
            var sRole = oContext.getProperty("Role");

            console.log("Edit position:", sPositionId, sRole);
            MessageToast.show("Editing position: " + sRole);
        },

        /**
         * Duplicate position
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onDuplicatePosition: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sRole = oContext.getProperty("Role");

            MessageToast.show("Duplicating position: " + sRole);
        },

        /**
         * Close position
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onClosePosition: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sRole = oContext.getProperty("Role");
            var that = this;

            MessageBox.confirm(
                "Are you sure you want to close the position: " + sRole + "?",
                {
                    title: "Close Position",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            MessageToast.show("Position closed: " + sRole);
                            that._loadHiringNeedsData(); // Refresh data
                        }
                    }
                }
            );
        },

        /**
         * Share position
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onSharePosition: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sRole = oContext.getProperty("Role");

            MessageToast.show("Sharing position: " + sRole);
        },

        /**
         * Refresh OpenPositions data
         */
        onRefreshHiringData: function () {
            console.log("Refreshing OpenPositions data...");

            // Clear current filters
            this.onClearHiringFilters();

            // Reload data
            this._loadOpenPositions();

            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("hiringDataRefreshed"));
        },

        /**
         * Get positions by Level (Priority)
         * @param {string} sLevel - Priority level
         * @returns {Array} Filtered positions
         */
        getPositionsByLevel: function (sLevel) {
            var oTable = this.byId("openPositionsTable");
            var oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return [];
            }

            var aAllContexts = oBinding.getContexts();
            var aFilteredPositions = [];

            aAllContexts.forEach(function (oContext) {
                var oPosition = oContext.getObject();
                if (oPosition.Level === sLevel) {
                    aFilteredPositions.push(oPosition);
                }
            });

            console.log("Positions found for Level '" + sLevel + "':", aFilteredPositions.length);
            return aFilteredPositions;
        },

        /**
         * Get positions by Department
         * @param {string} sDepartment - Department name
         * @returns {Array} Filtered positions
         */
        getPositionsByDepartment: function (sDepartment) {
            var oTable = this.byId("openPositionsTable");
            var oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return [];
            }

            var aAllContexts = oBinding.getContexts();
            var aFilteredPositions = [];

            aAllContexts.forEach(function (oContext) {
                var oPosition = oContext.getObject();
                if (oPosition.Department === sDepartment) {
                    aFilteredPositions.push(oPosition);
                }
            });

            console.log("Positions found for Department '" + sDepartment + "':", aFilteredPositions.length);
            return aFilteredPositions;
        },

        /**
         * Get department statistics
         * @returns {Object} Department statistics
         */
        getDepartmentStatistics: function () {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");
            var oDepartmentStats = oHiringNeedsModel.getProperty("/departmentStats");

            console.log("Department statistics:", oDepartmentStats);
            return oDepartmentStats || {};
        },

        /**
         * Get level statistics
         * @returns {Object} Level statistics
         */
        getLevelStatistics: function () {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");
            var oLevelStats = oHiringNeedsModel.getProperty("/levelStats");

            console.log("Level statistics:", oLevelStats);
            return oLevelStats || {};
        },

        /**
         * Quick filter for urgent positions
         */
        showUrgentPositions: function () {
            this.filterByLevel("Urgent");
        },

        /**
         * Quick filter for high priority positions
         */
        showHighPriorityPositions: function () {
            this.filterByLevel("High");
        },

        /**
         * Quick filter for active positions
         */
        showActivePositions: function () {
            var oHiringNeedsModel = this.getView().getModel("hiringNeeds");
            oHiringNeedsModel.setProperty("/filters/status", "Active");
            this.byId("statusHiringFilter").setSelectedKey("Active");
            this._applyFilters();
            MessageToast.show("Showing active positions only");
        },

        /**
         * Reset to default sorting (Level desc, Department asc)
         */
        resetToDefaultSorting: function () {
            console.log("Resetting to default sorting");
            this._initializeTableSorting();
            MessageToast.show("Reset to default sorting: Level (Urgent first), Department (A-Z)");
        },

        /**
         * Add new position
         */
        onAddPosition: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Export hiring data
         */
        onExportHiringData: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Handle bulk actions
         */
        onBulkActions: function () {
            var oTable = this.byId("openPositionsTable");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageToast.show("Please select positions to perform bulk actions");
                return;
            }

            MessageToast.show("Bulk actions for " + aSelectedItems.length + " positions");
        },

        /**
         * Generate hiring report
         */
        onGenerateHiringReport: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Request new position
         */
        onRequestNewPosition: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        // Formatter Methods

        /**
         * Format priority highlight for table rows
         * @param {string} sLevel - Priority level
         * @returns {string} Highlight type
         */
        formatPriorityHighlight: function (sLevel) {
            switch (sLevel) {
                case "Urgent":
                    return "Error";
                case "High":
                    return "Warning";
                case "Medium":
                    return "Information";
                case "Low":
                    return "Success";
                default:
                    return "None";
            }
        },

        /**
         * Format days remaining until required date
         * @param {string} sRequiredBy - Required by date
         * @returns {string} Days remaining text
         */
        formatDaysRemaining: function (sRequiredBy) {
            if (!sRequiredBy) {
                return "No deadline";
            }

            var dRequiredBy = new Date(sRequiredBy);
            var dToday = new Date();
            var iDaysDiff = Math.ceil((dRequiredBy - dToday) / (1000 * 60 * 60 * 24));

            if (iDaysDiff < 0) {
                return Math.abs(iDaysDiff) + " days overdue";
            } else if (iDaysDiff === 0) {
                return "Due today";
            } else if (iDaysDiff === 1) {
                return "1 day remaining";
            } else {
                return iDaysDiff + " days remaining";
            }
        },

        /**
         * Format status state for ObjectStatus
         * @param {string} sStatus - Status value
         * @returns {string} State
         */
        formatStatusState: function (sStatus) {
            switch (sStatus) {
                case "Active":
                    return "Success";
                case "On Hold":
                    return "Warning";
                case "Filled":
                    return "Information";
                case "Cancelled":
                    return "Error";
                default:
                    return "None";
            }
        },

        /**
         * Format priority state for ObjectStatus
         * @param {string} sLevel - Priority level
         * @returns {string} State
         */
        formatPriorityState: function (sLevel) {
            switch (sLevel) {
                case "Urgent":
                    return "Error";
                case "High":
                    return "Warning";
                case "Medium":
                    return "Information";
                case "Low":
                    return "Success";
                default:
                    return "None";
            }
        },

        /**
         * Format priority icon
         * @param {string} sLevel - Priority level
         * @returns {string} Icon source
         */
        formatPriorityIcon: function (sLevel) {
            switch (sLevel) {
                case "Urgent":
                    return "sap-icon://alert";
                case "High":
                    return "sap-icon://warning";
                case "Medium":
                    return "sap-icon://information";
                case "Low":
                    return "sap-icon://accept";
                default:
                    return "sap-icon://neutral";
            }
        },

        /**
         * Format priority color
         * @param {string} sLevel - Priority level
         * @returns {string} Color
         */
        formatPriorityColor: function (sLevel) {
            switch (sLevel) {
                case "Urgent":
                    return "#E74C3C"; // Red
                case "High":
                    return "#F39C12"; // Orange
                case "Medium":
                    return "#3498DB"; // Blue
                case "Low":
                    return "#2ECC71"; // Green
                default:
                    return "#666666"; // Gray
            }
        },

        /**
         * Format salary range
         * @param {number} iSalaryMin - Minimum salary
         * @param {number} iSalaryMax - Maximum salary
         * @returns {string} Formatted salary range
         */
        formatSalaryRange: function (iSalaryMin, iSalaryMax) {
            if (!iSalaryMin && !iSalaryMax) {
                return "Not specified";
            }

            var sMin = iSalaryMin ? "$" + iSalaryMin.toLocaleString() : "N/A";
            var sMax = iSalaryMax ? "$" + iSalaryMax.toLocaleString() : "N/A";

            if (iSalaryMin && iSalaryMax) {
                return sMin + " - " + sMax;
            } else if (iSalaryMin) {
                return "From " + sMin;
            } else {
                return "Up to " + sMax;
            }
        }
    });
});
