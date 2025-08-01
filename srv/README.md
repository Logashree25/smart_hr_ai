# Smart HR Insights Portal - Backend Services

This directory contains the CAP service layer for the Smart HR Insights Portal.

## Service Structure

### HRService (`hr-service.cds`)
Main service exposing HR data and analytics capabilities:

#### Entities
- **Employees** - Core employee data with hierarchical relationships
- **SatisfactionSurvey** - Employee satisfaction survey responses
- **Feedback** - Peer and manager feedback
- **PerformanceMetrics** - Performance scores and goal achievement
- **AttritionRisk** - AI-generated attrition risk assessments
- **TrainingRecommendation** - AI-generated training suggestions
- **OpenPositions** - Job openings and recruitment data

#### Views
- **EmployeeInsights** - Enhanced employee view with manager information
- **DepartmentSummary** - Department-level employee and key talent counts
- **AttritionRiskSummary** - Department-level attrition risk analysis

#### AI-Powered Actions
- **generateAttritionRisk(employeeId)** - Calculate attrition risk for an employee
- **generateTrainingRecommendations(employeeId)** - Generate personalized training recommendations
- **analyzeTeamPerformance(department)** - Analyze team performance metrics

## Service Implementation (`hr-service.js`)

### Validation Logic
- Manager relationship validation for employee creation
- Self-feedback prevention
- Score range validation for surveys and performance metrics
- Data integrity checks

### AI Simulation
The current implementation includes simplified AI logic for demonstration:
- **Attrition Risk**: Based on performance trends, satisfaction scores, and tenure
- **Training Recommendations**: Role-based and performance-driven suggestions
- **Team Analysis**: Statistical analysis of team performance metrics

### Error Handling
- Comprehensive input validation
- Proper HTTP status codes
- Descriptive error messages
- Transaction safety

## Data Model Features

### Relationships
- **Hierarchical Employee Structure**: Manager-subordinate relationships
- **Associations**: Proper foreign key relationships between entities
- **Compositions**: Parent-child relationships for data integrity

### Temporal Data
- Uses CAP's `managed` aspect for automatic timestamps
- Tracks creation and modification times
- Supports audit trails

### Key Talent Tracking
- Boolean flag for identifying key talent
- Used in analytics and risk assessments
- Supports succession planning

## Usage Examples

### Basic CRUD Operations
```javascript
// Get all employees
GET /hr/Employees

// Get employee with manager info
GET /hr/EmployeeInsights

// Create new employee
POST /hr/Employees
{
  "FirstName": "John",
  "LastName": "Doe",
  "Role": "Developer",
  "Department": "Engineering",
  "HireDate": "2024-01-01"
}
```

### AI Actions
```javascript
// Generate attrition risk
POST /hr/generateAttritionRisk
{ "employeeId": "123" }

// Get training recommendations
POST /hr/generateTrainingRecommendations
{ "employeeId": "123" }

// Analyze team performance
POST /hr/analyzeTeamPerformance
{ "department": "Engineering" }
```

### Analytics Views
```javascript
// Department summary
GET /hr/DepartmentSummary

// Attrition risk by department
GET /hr/AttritionRiskSummary
```

## Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- CRUD operations
- Data validation
- AI action functionality
- View queries
- Error handling

## Future Enhancements

1. **Real AI Integration**: Replace simulation with actual ML models
2. **Advanced Analytics**: More sophisticated performance analysis
3. **Predictive Models**: Enhanced attrition and performance prediction
4. **Integration APIs**: Connect with external HR systems
5. **Real-time Updates**: WebSocket support for live data updates
