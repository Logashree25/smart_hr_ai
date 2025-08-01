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

    return Controller.extend("smart.hr.portal.controller.EmployeeList", {

        /**
         * Called when the controller is instantiated.
         */
        onInit: function () {
            // Get router and attach route matched handler
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("RouteEmployeeList").attachPatternMatched(this._onRouteMatched, this);

            // Initialize local models
            this._initializeModels();

            // Load employees from Employees entity
            this._loadEmployeesFromEntity();
        },

        /**
         * Initialize local models for employee list
         * @private
         */
        _initializeModels: function () {
            // Create employee list model for local state
            var oEmployeeListModel = new JSONModel({
                totalCount: 0,
                filteredCount: 0,
                summaryText: "Loading employees...",
                searchQuery: "",
                filters: {
                    department: "",
                    role: "",
                    location: "",
                    hireType: ""
                },
                sorting: {
                    field: "LastName",
                    descending: false
                },
                departments: [],
                roles: [],
                locations: [],
                hireTypes: []
            });

            this.getView().setModel(oEmployeeListModel, "employeeList");
        },

        /**
         * Load employees from Employees entity
         * @private
         */
        _loadEmployeesFromEntity: function () {
            var oModel = this.getView().getModel(); // HR Service OData model
            var oEmployeeListModel = this.getView().getModel("employeeList");
            var that = this;

            console.log("Loading employees from Employees entity...");

            // Create binding to Employees entity with expanded navigation properties
            var oBinding = oModel.bindList("/Employees", null, null, null, {
                $expand: "PerformanceMetrics,SurveyResponses,AttritionRisk,TrainingRecommendations"
            });

            // Request all employee contexts
            oBinding.requestContexts().then(function (aContexts) {
                console.log("Loaded " + aContexts.length + " employees from entity");

                // Extract unique values for filter dropdowns
                that._extractFilterOptions(aContexts);

                // Update summary
                oEmployeeListModel.setProperty("/totalCount", aContexts.length);
                oEmployeeListModel.setProperty("/filteredCount", aContexts.length);
                oEmployeeListModel.setProperty("/summaryText",
                    "Showing " + aContexts.length + " of " + aContexts.length + " employees");

            }).catch(function (oError) {
                console.error("Error loading employees from entity:", oError);
                oEmployeeListModel.setProperty("/summaryText", "Error loading employees");
                MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("errorLoadingEmployees"));
            });
        },

        /**
         * Extract unique filter options from employee data
         * @param {Array} aContexts - Employee contexts
         * @private
         */
        _extractFilterOptions: function (aContexts) {
            var oEmployeeListModel = this.getView().getModel("employeeList");
            var aDepartments = [];
            var aRoles = [];
            var aLocations = [];
            var aHireTypes = [];

            // Extract unique values
            aContexts.forEach(function (oContext) {
                var oEmployee = oContext.getObject();

                if (oEmployee.Department && aDepartments.indexOf(oEmployee.Department) === -1) {
                    aDepartments.push(oEmployee.Department);
                }
                if (oEmployee.Role && aRoles.indexOf(oEmployee.Role) === -1) {
                    aRoles.push(oEmployee.Role);
                }
                if (oEmployee.Location && aLocations.indexOf(oEmployee.Location) === -1) {
                    aLocations.push(oEmployee.Location);
                }
                if (oEmployee.HireType && aHireTypes.indexOf(oEmployee.HireType) === -1) {
                    aHireTypes.push(oEmployee.HireType);
                }
            });

            // Sort arrays
            aDepartments.sort();
            aRoles.sort();
            aLocations.sort();
            aHireTypes.sort();

            // Update model with filter options
            oEmployeeListModel.setProperty("/departments", aDepartments);
            oEmployeeListModel.setProperty("/roles", aRoles);
            oEmployeeListModel.setProperty("/locations", aLocations);
            oEmployeeListModel.setProperty("/hireTypes", aHireTypes);

            console.log("Filter options extracted:", {
                departments: aDepartments.length,
                roles: aRoles.length,
                locations: aLocations.length,
                hireTypes: aHireTypes.length
            });
        },

        /**
         * Route matched handler
         * @param {sap.ui.base.Event} oEvent - Route matched event
         * @private
         */
        _onRouteMatched: function (oEvent) {
            // Refresh employee data when route is matched
            this._loadEmployeesFromEntity();
            this._loadEmployeeData();
        },

        /**
         * Load employee data and update summary
         * @private
         */
        _loadEmployeeData: function () {
            var oTable = this.byId("employeeTable");
            var oBinding = oTable.getBinding("items");
            var oEmployeeListModel = this.getView().getModel("employeeList");
            var that = this;

            if (oBinding) {
                // Update total count when data is loaded
                oBinding.attachDataReceived(function () {
                    var iTotalCount = oBinding.getLength() || 0;
                    var iFilteredCount = oBinding.getCurrentContexts().length;

                    oEmployeeListModel.setProperty("/totalCount", iTotalCount);
                    oEmployeeListModel.setProperty("/filteredCount", iFilteredCount);
                    oEmployeeListModel.setProperty("/summaryText",
                        "Showing " + iFilteredCount + " of " + iTotalCount + " employees");
                });

                // Attach filter change handler to update counts
                oBinding.attachChange(function () {
                    that._updateFilteredCount();
                });
            }
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
         * Handle search functionality
         * @param {sap.ui.base.Event} oEvent - Search event
         */
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");

            // Update search query in model
            this.getView().getModel("employeeList").setProperty("/searchQuery", sQuery);

            // Apply all filters including search
            this._applyFilters();
        },

        /**
         * Apply all active filters (search + department + role)
         * @private
         */
        _applyFilters: function () {
            var oTable = this.byId("employeeTable");
            var oBinding = oTable.getBinding("items");
            var oEmployeeListModel = this.getView().getModel("employeeList");

            if (!oBinding) {
                return;
            }

            var aFilters = [];
            var sSearchQuery = oEmployeeListModel.getProperty("/searchQuery");
            var sSelectedDepartment = oEmployeeListModel.getProperty("/filters/department");
            var sSelectedRole = oEmployeeListModel.getProperty("/filters/role");
            var sSelectedLocation = oEmployeeListModel.getProperty("/filters/location");
            var sSelectedHireType = oEmployeeListModel.getProperty("/filters/hireType");

            // Search filter (OR across multiple fields)
            if (sSearchQuery && sSearchQuery.length > 0) {
                var oSearchFilter = new Filter({
                    filters: [
                        new Filter("FirstName", FilterOperator.Contains, sSearchQuery),
                        new Filter("LastName", FilterOperator.Contains, sSearchQuery),
                        new Filter("Role", FilterOperator.Contains, sSearchQuery),
                        new Filter("Department", FilterOperator.Contains, sSearchQuery),
                        new Filter("Team", FilterOperator.Contains, sSearchQuery),
                        new Filter("Location", FilterOperator.Contains, sSearchQuery)
                    ],
                    and: false
                });
                aFilters.push(oSearchFilter);
            }

            // Department filter
            if (sSelectedDepartment && sSelectedDepartment.length > 0) {
                aFilters.push(new Filter("Department", FilterOperator.EQ, sSelectedDepartment));
            }

            // Role filter
            if (sSelectedRole && sSelectedRole.length > 0) {
                aFilters.push(new Filter("Role", FilterOperator.EQ, sSelectedRole));
            }

            // Location filter
            if (sSelectedLocation && sSelectedLocation.length > 0) {
                aFilters.push(new Filter("Location", FilterOperator.EQ, sSelectedLocation));
            }

            // Hire Type filter
            if (sSelectedHireType && sSelectedHireType.length > 0) {
                aFilters.push(new Filter("HireType", FilterOperator.EQ, sSelectedHireType));
            }

            // Apply filters (AND logic between different filter types)
            oBinding.filter(aFilters);

            // Update filtered count
            this._updateFilteredCount();

            console.log("Applied filters:", {
                search: sSearchQuery,
                department: sSelectedDepartment,
                role: sSelectedRole,
                location: sSelectedLocation,
                hireType: sSelectedHireType,
                totalFilters: aFilters.length
            });
        },

        /**
         * Update filtered count in summary
         * @private
         */
        _updateFilteredCount: function () {
            var oTable = this.byId("employeeTable");
            var oBinding = oTable.getBinding("items");
            var oEmployeeListModel = this.getView().getModel("employeeList");

            if (oBinding) {
                var iFilteredCount = oBinding.getCurrentContexts().length;
                var iTotalCount = oEmployeeListModel.getProperty("/totalCount");

                oEmployeeListModel.setProperty("/filteredCount", iFilteredCount);
                oEmployeeListModel.setProperty("/summaryText",
                    "Showing " + iFilteredCount + " of " + iTotalCount + " employees");
            }
        },

        /**
         * Filter by department
         * @param {string} sDepartment - Department name
         */
        onFilterByDepartment: function (sDepartment) {
            this.getView().getModel("employeeList").setProperty("/filters/department", sDepartment);
            this._applyFilters();
        },

        /**
         * Filter by role
         * @param {string} sRole - Role name
         */
        onFilterByRole: function (sRole) {
            this.getView().getModel("employeeList").setProperty("/filters/role", sRole);
            this._applyFilters();
        },

        /**
         * Filter by location
         * @param {string} sLocation - Location name
         */
        onFilterByLocation: function (sLocation) {
            this.getView().getModel("employeeList").setProperty("/filters/location", sLocation);
            this._applyFilters();
        },

        /**
         * Filter by hire type
         * @param {string} sHireType - Hire type
         */
        onFilterByHireType: function (sHireType) {
            this.getView().getModel("employeeList").setProperty("/filters/hireType", sHireType);
            this._applyFilters();
        },

        /**
         * Clear all filters
         */
        onClearFilters: function () {
            var oEmployeeListModel = this.getView().getModel("employeeList");

            // Clear all filter values
            oEmployeeListModel.setProperty("/searchQuery", "");
            oEmployeeListModel.setProperty("/filters/department", "");
            oEmployeeListModel.setProperty("/filters/role", "");
            oEmployeeListModel.setProperty("/filters/location", "");
            oEmployeeListModel.setProperty("/filters/hireType", "");

            // Clear search field
            this.byId("employeeSearchField").setValue("");

            // Apply empty filters
            this._applyFilters();

            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("filtersCleared"));
        },

        /**
         * Quick filter for Engineering department
         */
        onQuickFilterEngineering: function () {
            this.onFilterByDepartment("Engineering");
        },

        /**
         * Quick filter for Sales department
         */
        onQuickFilterSales: function () {
            this.onFilterByDepartment("Sales");
        },

        /**
         * Quick filter for Marketing department
         */
        onQuickFilterMarketing: function () {
            this.onFilterByDepartment("Marketing");
        },

        /**
         * Quick filter for Human Resources department
         */
        onQuickFilterHR: function () {
            this.onFilterByDepartment("Human Resources");
        },

        /**
         * Handle employee selection
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onEmployeeSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext();
                var sEmployeeId = oContext.getProperty("ID");
                
                // Store selected employee for potential actions
                this._selectedEmployeeId = sEmployeeId;
                
                console.log("Employee selected:", sEmployeeId);
            }
        },

        /**
         * Handle employee press to navigate to detail view
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onEmployeePress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oContext.getProperty("ID");
            
            // Navigate to employee detail view
            this.oRouter.navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        /**
         * View employee details
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onViewEmployeeDetails: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sEmployeeId = oContext.getProperty("ID");
            
            // Navigate to employee detail view
            this.oRouter.navTo("RouteEmployeeDetail", {
                employeeId: sEmployeeId
            });
        },

        /**
         * Edit employee
         * @param {sap.ui.base.Event} oEvent - Press event
         */
        onEditEmployee: function (oEvent) {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Add new employee
         */
        onAddEmployee: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Refresh employee data
         */
        onRefreshEmployees: function () {
            var oTable = this.byId("employeeTable");
            var oBinding = oTable.getBinding("items");
            
            if (oBinding) {
                oBinding.refresh();
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("employeesRefreshed"));
            }
        },

        /**
         * Open filter dialog
         */
        onOpenFilterDialog: function () {
            var that = this;

            if (!this._oFilterDialog) {
                this._oFilterDialog = sap.ui.xmlfragment("smart.hr.portal.fragment.EmployeeFilterDialog", this);
                this.getView().addDependent(this._oFilterDialog);
            }

            // Set current filter values
            var oEmployeeListModel = this.getView().getModel("employeeList");
            var oFilterModel = new JSONModel({
                department: oEmployeeListModel.getProperty("/filters/department"),
                role: oEmployeeListModel.getProperty("/filters/role"),
                location: oEmployeeListModel.getProperty("/filters/location"),
                hireType: oEmployeeListModel.getProperty("/filters/hireType"),
                departments: oEmployeeListModel.getProperty("/departments"),
                roles: oEmployeeListModel.getProperty("/roles"),
                locations: oEmployeeListModel.getProperty("/locations"),
                hireTypes: oEmployeeListModel.getProperty("/hireTypes")
            });

            this._oFilterDialog.setModel(oFilterModel, "filter");
            this._oFilterDialog.open();
        },

        /**
         * Handle filter dialog confirm
         */
        onFilterDialogConfirm: function () {
            var oFilterModel = this._oFilterDialog.getModel("filter");
            var oEmployeeListModel = this.getView().getModel("employeeList");

            // Apply selected filters
            oEmployeeListModel.setProperty("/filters/department", oFilterModel.getProperty("/department"));
            oEmployeeListModel.setProperty("/filters/role", oFilterModel.getProperty("/role"));
            oEmployeeListModel.setProperty("/filters/location", oFilterModel.getProperty("/location"));
            oEmployeeListModel.setProperty("/filters/hireType", oFilterModel.getProperty("/hireType"));

            // Apply filters
            this._applyFilters();

            // Close dialog
            this._oFilterDialog.close();

            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("filtersApplied"));
        },

        /**
         * Handle filter dialog cancel
         */
        onFilterDialogCancel: function () {
            this._oFilterDialog.close();
        },

        /**
         * Reset filters in dialog
         */
        onFilterDialogReset: function () {
            var oFilterModel = this._oFilterDialog.getModel("filter");
            oFilterModel.setProperty("/department", "");
            oFilterModel.setProperty("/role", "");
            oFilterModel.setProperty("/location", "");
            oFilterModel.setProperty("/hireType", "");
        },

        /**
         * Open sort dialog
         */
        onOpenSortDialog: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

        /**
         * Export employees data
         */
        onExportEmployees: function () {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("featureComingSoon"));
        },

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
         * Format performance trend icon
         * @param {Array} aPerformanceMetrics - Performance metrics array
         * @returns {string} Icon source
         */
        formatPerformanceTrendIcon: function (aPerformanceMetrics) {
            if (!aPerformanceMetrics || aPerformanceMetrics.length < 2) {
                return "sap-icon://neutral";
            }
            
            var iCurrent = aPerformanceMetrics[aPerformanceMetrics.length - 1].ObjectiveCompletionRate;
            var iPrevious = aPerformanceMetrics[aPerformanceMetrics.length - 2].ObjectiveCompletionRate;
            
            if (iCurrent > iPrevious) {
                return "sap-icon://trend-up";
            } else if (iCurrent < iPrevious) {
                return "sap-icon://trend-down";
            } else {
                return "sap-icon://neutral";
            }
        },

        /**
         * Format performance trend color
         * @param {Array} aPerformanceMetrics - Performance metrics array
         * @returns {string} Color
         */
        formatPerformanceTrendColor: function (aPerformanceMetrics) {
            if (!aPerformanceMetrics || aPerformanceMetrics.length < 2) {
                return "#666666";
            }
            
            var iCurrent = aPerformanceMetrics[aPerformanceMetrics.length - 1].ObjectiveCompletionRate;
            var iPrevious = aPerformanceMetrics[aPerformanceMetrics.length - 2].ObjectiveCompletionRate;
            
            if (iCurrent > iPrevious) {
                return "#2ECC71"; // Green
            } else if (iCurrent < iPrevious) {
                return "#E74C3C"; // Red
            } else {
                return "#666666"; // Gray
            }
        },

        /**
         * Format sparkline placeholder
         * @param {Array} aPerformanceMetrics - Performance metrics array
         * @returns {string} Sparkline representation
         */
        formatSparklinePlaceholder: function (aPerformanceMetrics) {
            if (!aPerformanceMetrics || aPerformanceMetrics.length === 0) {
                return "▬▬▬▬▬";
            }
            
            // Create a simple text-based sparkline
            var aSparkline = [];
            aPerformanceMetrics.forEach(function (oMetric, iIndex) {
                var iScore = oMetric.ObjectiveCompletionRate;
                if (iScore >= 90) {
                    aSparkline.push("▲");
                } else if (iScore >= 70) {
                    aSparkline.push("●");
                } else {
                    aSparkline.push("▼");
                }
            });
            
            return aSparkline.join("");
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
         * Format satisfaction color
         * @param {Array} aSurveyResponses - Survey responses array
         * @returns {string} Color
         */
        formatSatisfactionColor: function (aSurveyResponses) {
            if (!aSurveyResponses || aSurveyResponses.length === 0) {
                return "#666666";
            }
            
            var oLatest = aSurveyResponses[aSurveyResponses.length - 1];
            var iScore = oLatest.Score;
            
            if (iScore >= 80) {
                return "#2ECC71"; // Green
            } else if (iScore >= 60) {
                return "#F39C12"; // Orange
            } else {
                return "#E74C3C"; // Red
            }
        }
    });
});
