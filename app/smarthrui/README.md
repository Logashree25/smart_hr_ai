# Smart HR Insights Portal - Frontend

## Overview

This is the SAPUI5/Fiori frontend application for the Smart HR Insights Portal. It provides a modern, responsive user interface for HR analytics and AI-powered insights.

## Features

### 🏠 Dashboard
- **KPI Overview**: Total employees, average satisfaction, high-risk employees, open positions
- **Employee Table**: Recent employees with quick actions
- **AI Insights Panel**: Quick AI actions and recent insights
- **Real-time Data**: Live data from CAP OData services

### 👤 Employee Detail
- **Personal Information**: Complete employee profile
- **Performance Metrics**: Historical performance data
- **Satisfaction History**: Survey responses and trends
- **AI-Powered Features**:
  - Attrition risk explanation
  - Training recommendations
  - Feedback summarization

### 📊 Analytics
- **Department Overview**: Statistics by department
- **Trend Analysis**: Satisfaction and performance trends
- **Attrition Analysis**: Risk assessment and predictions
- **AI Insights**: Department-level insights and recommendations

## Architecture

### Technology Stack
- **Framework**: SAPUI5 1.120.0
- **Design**: SAP Fiori Freestyle Application
- **Theme**: SAP Horizon
- **Libraries**: sap.m, sap.f, sap.suite.ui.commons, sap.ui.comp, sap.ui.table

### Data Sources
- **HR Service**: `/odata/v4/hr-service/` (Employee data, surveys, performance)
- **GenAI Service**: `/odata/v4/genai-service/` (AI actions and insights)

### Models
- **Default Model**: OData V4 model for HR Service
- **GenAI Model**: Named OData V4 model for GenAI Service
- **i18n Model**: Resource bundle for internationalization
- **Device Model**: Device-specific information
- **Analytics Model**: JSON model for analytics data

## Project Structure

```
app/smarthrui/
├── webapp/
│   ├── controller/
│   │   ├── App.controller.js          # Main app controller
│   │   ├── Dashboard.controller.js    # Dashboard logic
│   │   ├── EmployeeDetail.controller.js # Employee detail logic
│   │   └── Analytics.controller.js    # Analytics logic
│   ├── view/
│   │   ├── App.view.xml              # Main app view
│   │   ├── Dashboard.view.xml        # Dashboard view
│   │   ├── EmployeeDetail.view.xml   # Employee detail view
│   │   └── Analytics.view.xml        # Analytics view
│   ├── model/
│   │   └── models.js                 # Model factory
│   ├── i18n/
│   │   └── i18n.properties          # Text resources
│   ├── css/
│   │   └── style.css                # Custom styles
│   ├── Component.js                 # UI5 component
│   └── index.html                   # Entry point
├── manifest.json                    # App descriptor
├── ui5.yaml                        # UI5 tooling configuration
├── package.json                    # NPM configuration
└── README.md                       # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- UI5 CLI: `npm install -g @ui5/cli`
- Backend services running on `http://localhost:4005`

### Installation
```bash
cd app/smarthrui
npm install
```

### Development
```bash
# Start development server
npm start

# Build for production
npm run build

# Lint code
npm run lint
```

### Backend Integration
The app expects the following backend endpoints:
- HR Service: `http://localhost:4005/hr` → `/odata/v4/hr-service/`
- GenAI Service: `http://localhost:4005/genai` → `/odata/v4/genai-service/`

## Key Features Implementation

### 🔄 Data Binding
- **OData V4**: Automatic data binding with server-side operations
- **Batch Requests**: Optimized data loading
- **Auto Expand**: Related data loaded automatically

### 🤖 AI Integration
- **Action Binding**: Direct calls to GenAI service actions
- **Error Handling**: Graceful fallbacks for AI service failures
- **Loading States**: User feedback during AI processing

### 📱 Responsive Design
- **Adaptive Layout**: Works on desktop, tablet, and mobile
- **SAP Fiori Guidelines**: Consistent UX patterns
- **Accessibility**: WCAG compliant

### 🌐 Internationalization
- **i18n Support**: Text externalization
- **Multiple Languages**: Ready for localization
- **Date/Number Formatting**: Locale-aware formatting

## Customization

### Adding New Views
1. Create view XML file in `webapp/view/`
2. Create controller JS file in `webapp/controller/`
3. Add route in `manifest.json`
4. Add navigation logic

### Styling
- Modify `webapp/css/style.css` for custom styles
- Use SAP Fiori design tokens
- Follow SAP design guidelines

### AI Features
- Extend GenAI service actions
- Add new AI insights components
- Implement custom AI workflows

## Deployment

### SAP BTP
- Build: `npm run build`
- Deploy to Cloud Foundry or Kyma
- Configure destinations for backend services

### On-Premise
- Build and serve static files
- Configure reverse proxy for backend
- Set up authentication

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing
1. Follow SAP UI5 coding guidelines
2. Use ESLint for code quality
3. Test on multiple devices
4. Update documentation

## License
UNLICENSED - Internal use only
