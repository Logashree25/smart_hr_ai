sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Format risk level to appropriate color
         * @param {string} sRiskLevel - Risk level (Low, Medium, High, Critical)
         * @returns {string} Color code
         */
        riskLevelToColor: function (sRiskLevel) {
            if (!sRiskLevel) {
                return "#666666"; // Gray for unknown
            }

            switch (sRiskLevel.toLowerCase()) {
                case "low":
                    return "#2ECC71"; // Green
                case "medium":
                    return "#F39C12"; // Orange
                case "high":
                    return "#E74C3C"; // Red
                case "critical":
                    return "#8E44AD"; // Purple
                default:
                    return "#666666"; // Gray
            }
        },

        /**
         * Format risk level to semantic state
         * @param {string} sRiskLevel - Risk level
         * @returns {string} Semantic state (Success, Warning, Error, Information)
         */
        riskLevelToState: function (sRiskLevel) {
            if (!sRiskLevel) {
                return "None";
            }

            switch (sRiskLevel.toLowerCase()) {
                case "low":
                    return "Success";
                case "medium":
                    return "Warning";
                case "high":
                    return "Error";
                case "critical":
                    return "Error";
                default:
                    return "None";
            }
        },

        /**
         * Format priority level to color
         * @param {string} sPriority - Priority level (Low, Medium, High, Urgent)
         * @returns {string} Color code
         */
        priorityToColor: function (sPriority) {
            if (!sPriority) {
                return "#666666";
            }

            switch (sPriority.toLowerCase()) {
                case "low":
                    return "#2ECC71"; // Green
                case "medium":
                    return "#3498DB"; // Blue
                case "high":
                    return "#F39C12"; // Orange
                case "urgent":
                    return "#E74C3C"; // Red
                default:
                    return "#666666"; // Gray
            }
        },

        /**
         * Format priority level to semantic state
         * @param {string} sPriority - Priority level
         * @returns {string} Semantic state
         */
        priorityToState: function (sPriority) {
            if (!sPriority) {
                return "None";
            }

            switch (sPriority.toLowerCase()) {
                case "low":
                    return "Success";
                case "medium":
                    return "Information";
                case "high":
                    return "Warning";
                case "urgent":
                    return "Error";
                default:
                    return "None";
            }
        },

        /**
         * Format priority level to icon
         * @param {string} sPriority - Priority level
         * @returns {string} Icon source
         */
        priorityToIcon: function (sPriority) {
            if (!sPriority) {
                return "sap-icon://neutral";
            }

            switch (sPriority.toLowerCase()) {
                case "low":
                    return "sap-icon://accept";
                case "medium":
                    return "sap-icon://information";
                case "high":
                    return "sap-icon://warning";
                case "urgent":
                    return "sap-icon://alert";
                default:
                    return "sap-icon://neutral";
            }
        },

        /**
         * Format date to relative time (e.g., "2 days ago", "in 3 weeks")
         * @param {Date|string} vDate - Date object or ISO string
         * @returns {string} Formatted relative time
         */
        dateToRelativeTime: function (vDate) {
            if (!vDate) {
                return "Unknown";
            }

            var dDate = vDate instanceof Date ? vDate : new Date(vDate);
            var dNow = new Date();
            var iDiffMs = dDate.getTime() - dNow.getTime();
            var iDiffDays = Math.ceil(iDiffMs / (1000 * 60 * 60 * 24));

            if (iDiffDays === 0) {
                return "Today";
            } else if (iDiffDays === 1) {
                return "Tomorrow";
            } else if (iDiffDays === -1) {
                return "Yesterday";
            } else if (iDiffDays > 0) {
                if (iDiffDays <= 7) {
                    return "In " + iDiffDays + " day" + (iDiffDays > 1 ? "s" : "");
                } else if (iDiffDays <= 30) {
                    var iWeeks = Math.ceil(iDiffDays / 7);
                    return "In " + iWeeks + " week" + (iWeeks > 1 ? "s" : "");
                } else {
                    var iMonths = Math.ceil(iDiffDays / 30);
                    return "In " + iMonths + " month" + (iMonths > 1 ? "s" : "");
                }
            } else {
                var iAbsDays = Math.abs(iDiffDays);
                if (iAbsDays <= 7) {
                    return iAbsDays + " day" + (iAbsDays > 1 ? "s" : "") + " ago";
                } else if (iAbsDays <= 30) {
                    var iWeeks = Math.ceil(iAbsDays / 7);
                    return iWeeks + " week" + (iWeeks > 1 ? "s" : "") + " ago";
                } else {
                    var iMonths = Math.ceil(iAbsDays / 30);
                    return iMonths + " month" + (iMonths > 1 ? "s" : "") + " ago";
                }
            }
        },

        /**
         * Format date to short format (e.g., "Jan 15, 2024")
         * @param {Date|string} vDate - Date object or ISO string
         * @returns {string} Formatted date
         */
        dateToShort: function (vDate) {
            if (!vDate) {
                return "N/A";
            }

            var dDate = vDate instanceof Date ? vDate : new Date(vDate);
            var aMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
            return aMonths[dDate.getMonth()] + " " + 
                   dDate.getDate() + ", " + 
                   dDate.getFullYear();
        },

        /**
         * Format performance score to color
         * @param {number} iScore - Performance score (0-100)
         * @returns {string} Color code
         */
        performanceScoreToColor: function (iScore) {
            if (typeof iScore !== "number") {
                return "#666666";
            }

            if (iScore >= 90) {
                return "#2ECC71"; // Excellent - Green
            } else if (iScore >= 80) {
                return "#27AE60"; // Good - Dark Green
            } else if (iScore >= 70) {
                return "#F39C12"; // Average - Orange
            } else if (iScore >= 60) {
                return "#E67E22"; // Below Average - Dark Orange
            } else {
                return "#E74C3C"; // Poor - Red
            }
        },

        /**
         * Format performance score to state
         * @param {number} iScore - Performance score (0-100)
         * @returns {string} Semantic state
         */
        performanceScoreToState: function (iScore) {
            if (typeof iScore !== "number") {
                return "None";
            }

            if (iScore >= 85) {
                return "Success";
            } else if (iScore >= 70) {
                return "Warning";
            } else {
                return "Error";
            }
        },

        /**
         * Format satisfaction level to color
         * @param {string} sSatisfaction - Satisfaction level
         * @returns {string} Color code
         */
        satisfactionToColor: function (sSatisfaction) {
            if (!sSatisfaction) {
                return "#666666";
            }

            switch (sSatisfaction.toLowerCase()) {
                case "very satisfied":
                    return "#2ECC71"; // Green
                case "satisfied":
                    return "#27AE60"; // Dark Green
                case "neutral":
                    return "#3498DB"; // Blue
                case "dissatisfied":
                    return "#F39C12"; // Orange
                case "very dissatisfied":
                    return "#E74C3C"; // Red
                default:
                    return "#666666"; // Gray
            }
        },

        /**
         * Format employment status to color
         * @param {string} sStatus - Employment status
         * @returns {string} Color code
         */
        employmentStatusToColor: function (sStatus) {
            if (!sStatus) {
                return "#666666";
            }

            switch (sStatus.toLowerCase()) {
                case "active":
                    return "#2ECC71"; // Green
                case "on leave":
                    return "#F39C12"; // Orange
                case "terminated":
                    return "#E74C3C"; // Red
                case "retired":
                    return "#9B59B6"; // Purple
                case "probation":
                    return "#E67E22"; // Dark Orange
                default:
                    return "#666666"; // Gray
            }
        },

        /**
         * Format currency amount
         * @param {number} iAmount - Amount
         * @param {string} sCurrency - Currency code (default: USD)
         * @returns {string} Formatted currency
         */
        formatCurrency: function (iAmount, sCurrency) {
            if (typeof iAmount !== "number") {
                return "N/A";
            }

            var sCurrencyCode = sCurrency || "USD";
            var sCurrencySymbol = sCurrencyCode === "USD" ? "$" : sCurrencyCode + " ";
            
            return sCurrencySymbol + iAmount.toLocaleString();
        },

        /**
         * Format percentage with proper rounding
         * @param {number} fValue - Decimal value (0.75 = 75%)
         * @param {number} iPrecision - Decimal places (default: 1)
         * @returns {string} Formatted percentage
         */
        formatPercentage: function (fValue, iPrecision) {
            if (typeof fValue !== "number") {
                return "N/A";
            }

            var iDecimals = iPrecision || 1;
            var fPercentage = fValue * 100;
            
            return fPercentage.toFixed(iDecimals) + "%";
        },

        /**
         * Format department name with proper capitalization
         * @param {string} sDepartment - Department name
         * @returns {string} Formatted department name
         */
        formatDepartment: function (sDepartment) {
            if (!sDepartment) {
                return "Unknown Department";
            }

            // Convert to title case
            return sDepartment.toLowerCase().replace(/\b\w/g, function (l) {
                return l.toUpperCase();
            });
        },

        /**
         * Format employee name
         * @param {string} sFirstName - First name
         * @param {string} sLastName - Last name
         * @returns {string} Formatted full name
         */
        formatEmployeeName: function (sFirstName, sLastName) {
            var sFirst = sFirstName || "";
            var sLast = sLastName || "";
            
            if (!sFirst && !sLast) {
                return "Unknown Employee";
            }
            
            return (sFirst + " " + sLast).trim();
        },

        /**
         * Format training status to color
         * @param {string} sStatus - Training status
         * @returns {string} Color code
         */
        trainingStatusToColor: function (sStatus) {
            if (!sStatus) {
                return "#666666";
            }

            switch (sStatus.toLowerCase()) {
                case "completed":
                    return "#2ECC71"; // Green
                case "in progress":
                    return "#3498DB"; // Blue
                case "scheduled":
                    return "#F39C12"; // Orange
                case "cancelled":
                    return "#E74C3C"; // Red
                case "not started":
                    return "#95A5A6"; // Light Gray
                default:
                    return "#666666"; // Gray
            }
        },

        /**
         * Format confidence level to visual indicator
         * @param {number} iConfidence - Confidence percentage (0-100)
         * @returns {string} Visual indicator text
         */
        formatConfidenceLevel: function (iConfidence) {
            if (typeof iConfidence !== "number") {
                return "Unknown";
            }

            if (iConfidence >= 90) {
                return "Very High";
            } else if (iConfidence >= 80) {
                return "High";
            } else if (iConfidence >= 70) {
                return "Medium";
            } else if (iConfidence >= 60) {
                return "Low";
            } else {
                return "Very Low";
            }
        },

        /**
         * Format file size in human readable format
         * @param {number} iBytes - File size in bytes
         * @returns {string} Formatted file size
         */
        formatFileSize: function (iBytes) {
            if (typeof iBytes !== "number" || iBytes === 0) {
                return "0 B";
            }

            var aUnits = ["B", "KB", "MB", "GB", "TB"];
            var iUnitIndex = Math.floor(Math.log(iBytes) / Math.log(1024));
            var fSize = iBytes / Math.pow(1024, iUnitIndex);
            
            return fSize.toFixed(1) + " " + aUnits[iUnitIndex];
        },

        /**
         * Format duration in minutes to human readable format
         * @param {number} iMinutes - Duration in minutes
         * @returns {string} Formatted duration
         */
        formatDuration: function (iMinutes) {
            if (typeof iMinutes !== "number" || iMinutes < 0) {
                return "N/A";
            }

            if (iMinutes < 60) {
                return iMinutes + " min";
            } else if (iMinutes < 1440) { // Less than 24 hours
                var iHours = Math.floor(iMinutes / 60);
                var iRemainingMinutes = iMinutes % 60;
                return iHours + "h" + (iRemainingMinutes > 0 ? " " + iRemainingMinutes + "m" : "");
            } else {
                var iDays = Math.floor(iMinutes / 1440);
                var iRemainingHours = Math.floor((iMinutes % 1440) / 60);
                return iDays + "d" + (iRemainingHours > 0 ? " " + iRemainingHours + "h" : "");
            }
        },

        /**
         * Format attrition risk level to color and icon
         * @param {string} sRiskLevel - Attrition risk level
         * @returns {object} Object with color and icon
         */
        attritionRiskToVisual: function (sRiskLevel) {
            if (!sRiskLevel) {
                return { color: "#666666", icon: "sap-icon://neutral" };
            }

            switch (sRiskLevel.toLowerCase()) {
                case "low":
                    return { color: "#2ECC71", icon: "sap-icon://accept" };
                case "medium":
                    return { color: "#F39C12", icon: "sap-icon://warning" };
                case "high":
                    return { color: "#E74C3C", icon: "sap-icon://alert" };
                case "critical":
                    return { color: "#8E44AD", icon: "sap-icon://error" };
                default:
                    return { color: "#666666", icon: "sap-icon://neutral" };
            }
        },

        /**
         * Format hiring status to appropriate display
         * @param {string} sStatus - Hiring status
         * @returns {string} Formatted status
         */
        formatHiringStatus: function (sStatus) {
            if (!sStatus) {
                return "Unknown";
            }

            switch (sStatus.toLowerCase()) {
                case "active":
                    return "Active Recruiting";
                case "on hold":
                    return "On Hold";
                case "filled":
                    return "Position Filled";
                case "cancelled":
                    return "Cancelled";
                case "draft":
                    return "Draft";
                default:
                    return sStatus;
            }
        },

        /**
         * Format skill level to visual representation
         * @param {string} sLevel - Skill level (Beginner, Intermediate, Advanced, Expert)
         * @returns {string} Visual representation
         */
        formatSkillLevel: function (sLevel) {
            if (!sLevel) {
                return "Not Assessed";
            }

            switch (sLevel.toLowerCase()) {
                case "beginner":
                    return "★☆☆☆☆ Beginner";
                case "intermediate":
                    return "★★☆☆☆ Intermediate";
                case "advanced":
                    return "★★★☆☆ Advanced";
                case "expert":
                    return "★★★★☆ Expert";
                case "master":
                    return "★★★★★ Master";
                default:
                    return sLevel;
            }
        },

        /**
         * Format work location type
         * @param {string} sLocation - Work location type
         * @returns {string} Formatted location
         */
        formatWorkLocation: function (sLocation) {
            if (!sLocation) {
                return "Not Specified";
            }

            switch (sLocation.toLowerCase()) {
                case "office":
                    return "🏢 Office";
                case "remote":
                    return "🏠 Remote";
                case "hybrid":
                    return "🔄 Hybrid";
                case "field":
                    return "🚗 Field Work";
                default:
                    return sLocation;
            }
        },

        /**
         * Format engagement score to descriptive text
         * @param {number} iScore - Engagement score (1-10)
         * @returns {string} Descriptive text
         */
        formatEngagementScore: function (iScore) {
            if (typeof iScore !== "number") {
                return "Not Rated";
            }

            if (iScore >= 9) {
                return "Highly Engaged";
            } else if (iScore >= 7) {
                return "Engaged";
            } else if (iScore >= 5) {
                return "Moderately Engaged";
            } else if (iScore >= 3) {
                return "Disengaged";
            } else {
                return "Highly Disengaged";
            }
        },

        /**
         * Format policy compliance status
         * @param {string} sStatus - Compliance status
         * @returns {string} Formatted status with icon
         */
        formatComplianceStatus: function (sStatus) {
            if (!sStatus) {
                return "❓ Unknown";
            }

            switch (sStatus.toLowerCase()) {
                case "compliant":
                    return "✅ Compliant";
                case "non-compliant":
                    return "❌ Non-Compliant";
                case "pending":
                    return "⏳ Pending Review";
                case "exempt":
                    return "🔓 Exempt";
                default:
                    return "❓ " + sStatus;
            }
        },

        /**
         * Format feedback sentiment
         * @param {string} sSentiment - Sentiment (Positive, Negative, Neutral)
         * @returns {string} Formatted sentiment with emoji
         */
        formatFeedbackSentiment: function (sSentiment) {
            if (!sSentiment) {
                return "😐 Neutral";
            }

            switch (sSentiment.toLowerCase()) {
                case "positive":
                    return "😊 Positive";
                case "negative":
                    return "😞 Negative";
                case "neutral":
                    return "😐 Neutral";
                case "mixed":
                    return "🤔 Mixed";
                default:
                    return "😐 " + sSentiment;
            }
        },

        /**
         * Format years of experience
         * @param {number} iYears - Years of experience
         * @returns {string} Formatted experience
         */
        formatExperience: function (iYears) {
            if (typeof iYears !== "number" || iYears < 0) {
                return "Not Specified";
            }

            if (iYears === 0) {
                return "Entry Level";
            } else if (iYears === 1) {
                return "1 Year";
            } else if (iYears < 5) {
                return iYears + " Years (Junior)";
            } else if (iYears < 10) {
                return iYears + " Years (Mid-Level)";
            } else {
                return iYears + " Years (Senior)";
            }
        },

        /**
         * Format AI confidence level with visual indicator
         * @param {number} iConfidence - Confidence percentage
         * @returns {string} Formatted confidence with indicator
         */
        formatAIConfidence: function (iConfidence) {
            if (typeof iConfidence !== "number") {
                return "❓ Unknown";
            }

            if (iConfidence >= 90) {
                return "🟢 Very High (" + iConfidence + "%)";
            } else if (iConfidence >= 80) {
                return "🔵 High (" + iConfidence + "%)";
            } else if (iConfidence >= 70) {
                return "🟡 Medium (" + iConfidence + "%)";
            } else if (iConfidence >= 60) {
                return "🟠 Low (" + iConfidence + "%)";
            } else {
                return "🔴 Very Low (" + iConfidence + "%)";
            }
        },

        /**
         * Format impact level with visual representation
         * @param {string} sImpact - Impact level (Low, Medium, High)
         * @returns {string} Formatted impact
         */
        formatImpactLevel: function (sImpact) {
            if (!sImpact) {
                return "❓ Unknown";
            }

            switch (sImpact.toLowerCase()) {
                case "low":
                    return "🔵 Low Impact";
                case "medium":
                    return "🟡 Medium Impact";
                case "high":
                    return "🔴 High Impact";
                case "critical":
                    return "🟣 Critical Impact";
                default:
                    return "❓ " + sImpact;
            }
        },

        /**
         * Format boolean values to Yes/No with icons
         * @param {boolean} bValue - Boolean value
         * @returns {string} Formatted Yes/No
         */
        formatYesNo: function (bValue) {
            if (typeof bValue !== "boolean") {
                return "❓ Unknown";
            }

            return bValue ? "✅ Yes" : "❌ No";
        },

        /**
         * Format training completion percentage
         * @param {number} iCompleted - Number completed
         * @param {number} iTotal - Total number
         * @returns {string} Formatted percentage
         */
        formatCompletionRate: function (iCompleted, iTotal) {
            if (typeof iCompleted !== "number" || typeof iTotal !== "number" || iTotal === 0) {
                return "N/A";
            }

            var fPercentage = (iCompleted / iTotal) * 100;
            return Math.round(fPercentage) + "% (" + iCompleted + "/" + iTotal + ")";
        },

        /**
         * Format urgency level with appropriate styling
         * @param {string} sUrgency - Urgency level
         * @returns {string} Formatted urgency
         */
        formatUrgency: function (sUrgency) {
            if (!sUrgency) {
                return "⚪ Normal";
            }

            switch (sUrgency.toLowerCase()) {
                case "low":
                    return "🟢 Low";
                case "normal":
                    return "⚪ Normal";
                case "high":
                    return "🟡 High";
                case "urgent":
                    return "🔴 Urgent";
                case "critical":
                    return "🟣 Critical";
                default:
                    return "⚪ " + sUrgency;
            }
        }
    };
});
