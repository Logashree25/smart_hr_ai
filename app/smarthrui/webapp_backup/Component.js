sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/m/MessageToast",
    "smart/hr/portal/model/models"
], function (UIComponent, Device, MessageToast, models) {
    "use strict";

    return UIComponent.extend("smart.hr.portal.Component", {

        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Initialize models from manifest
            this._initializeModels();

            // Enable routing
            this.getRouter().initialize();

            // Set up error handling for OData models
            this._setupErrorHandling();
        },

        /**
         * Initialize models from manifest and set additional JSON models
         * @private
         */
        _initializeModels: function () {
            // Models are automatically initialized from manifest.json
            // Set additional JSON models for application state

            console.log("Initializing Smart HR Portal models...");

            // Use the enhanced models.js to set all models
            models.setModelsOnComponent(this);

            // Initialize model data with default values
            models.initializeModelData(this);

            console.log("Smart HR Portal models initialized successfully");
        },

        /**
         * Get the GenAI model instance
         * @public
         * @returns {sap.ui.model.odata.v4.ODataModel} The GenAI OData model
         */
        getGenAIModel: function () {
            return this.getModel("genai");
        },

        /**
         * Get the AI suggestions model instance
         * @public
         * @returns {sap.ui.model.json.JSONModel} The AI suggestions model
         */
        getAISuggestionsModel: function () {
            return this.getModel("aiSuggestions");
        },

        /**
         * Get the UI state model instance
         * @public
         * @returns {sap.ui.model.json.JSONModel} The UI state model
         */
        getUIStateModel: function () {
            return this.getModel("uiState");
        },

        /**
         * Get the HR service model instance (default model)
         * @public
         * @returns {sap.ui.model.odata.v4.ODataModel} The HR service OData model
         */
        getHRModel: function () {
            return this.getModel();
        },

        /**
         * Set up error handling for OData models
         * @private
         */
        _setupErrorHandling: function () {
            var oHRModel = this.getHRModel();
            var oGenAIModel = this.getGenAIModel();
            var oUIStateModel = this.getUIStateModel();
            var oAISuggestionsModel = this.getAISuggestionsModel();

            console.log("Setting up enhanced error handling for Smart HR Portal models...");

            // HR Service error handling
            if (oHRModel) {
                oHRModel.attachRequestFailed(function (oEvent) {
                    var oError = oEvent.getParameter("response");
                    console.error("HR Service request failed:", oError);

                    // Show user-friendly error message
                    MessageToast.show("Error connecting to HR service. Please try again later.");

                    // Update UI state to show error
                    if (oUIStateModel) {
                        oUIStateModel.setProperty("/hasError", true);
                        oUIStateModel.setProperty("/errorMessage", "HR service connection error");
                        oUIStateModel.setProperty("/isLoading", false);
                    }
                });

                // Handle successful HR requests
                oHRModel.attachRequestCompleted(function () {
                    // Clear error state on successful request
                    if (oUIStateModel) {
                        oUIStateModel.setProperty("/hasError", false);
                        oUIStateModel.setProperty("/errorMessage", "");
                        oUIStateModel.setProperty("/isLoading", false);
                    }
                });

                // Handle session timeout or authentication errors
                oHRModel.attachSessionTimeout(function () {
                    MessageToast.show("Session expired. Please refresh the page.");
                });
            }

            // GenAI Service error handling
            if (oGenAIModel) {
                oGenAIModel.attachRequestFailed(function (oEvent) {
                    var oError = oEvent.getParameter("response");
                    console.error("GenAI Service request failed:", oError);

                    // Show user-friendly error message based on error type
                    var sMessage = "Error connecting to AI service. Please try again later.";
                    if (oError && oError.status === 503) {
                        sMessage = "AI service is temporarily unavailable. Please try again later.";
                    } else if (oError && oError.status === 429) {
                        sMessage = "AI service rate limit exceeded. Please wait a moment and try again.";
                    }
                    MessageToast.show(sMessage);

                    // Update AI suggestions model status
                    if (oAISuggestionsModel) {
                        oAISuggestionsModel.setProperty("/aiStatus", "Error");
                        oAISuggestionsModel.setProperty("/isAnalyzing", false);
                        oAISuggestionsModel.setProperty("/footerSummaryText", "AI service error");
                    }
                });

                // Handle successful GenAI requests
                oGenAIModel.attachRequestCompleted(function () {
                    // Update AI suggestions model status on success
                    if (oAISuggestionsModel) {
                        oAISuggestionsModel.setProperty("/aiStatus", "Ready");
                        oAISuggestionsModel.setProperty("/isAnalyzing", false);
                    }
                });

                // Handle session timeout for GenAI service
                oGenAIModel.attachSessionTimeout(function () {
                    MessageToast.show("AI service session expired. Please refresh the page.");
                });
            }
        },

        /**
         * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
         * design mode class should be set, which influences the size appearance of some controls.
         * @public
         * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
         */
        getContentDensityClass: function () {
            if (this._sContentDensityClass === undefined) {
                // Check whether FLP has already set the content density class; do nothing in this case
                if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
                    this._sContentDensityClass = "";
                } else if (!Device.support.touch) { // Apply "compact" mode if touch is not supported
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        },

        /**
         * Get the router instance
         * @public
         * @returns {sap.ui.core.routing.Router} The router instance
         */
        getRouter: function () {
            return UIComponent.prototype.getRouter.apply(this, arguments);
        },

        /**
         * Convenience method to get the resource bundle for i18n
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} The resource bundle
         */
        getResourceBundle: function () {
            return this.getModel("i18n").getResourceBundle();
        },

        /**
         * Exit method called when component is destroyed
         * @public
         * @override
         */
        exit: function () {
            // Clean up resources
            UIComponent.prototype.exit.apply(this, arguments);
        }
    });
});
