const cds = require('@sap/cds');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Smart HR Portal Database...');

    // Load the CDS model
    console.log('📋 Loading CDS model...');
    const model = await cds.load('*');

    // Connect to the database
    console.log('🔌 Connecting to database...');
    const db = await cds.connect.to('db');

    // Deploy the schema
    console.log('📊 Deploying database schema...');
    await cds.deploy(model).to(db);

    console.log('✅ Database initialization completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run "npm start" to start the service');
    console.log('2. Open http://localhost:4004 to access the service');
    console.log('3. Use the following endpoints:');
    console.log('   - GET /hr/Employees - List all employees');
    console.log('   - GET /hr/EmployeeInsights - Employee insights view');
    console.log('   - GET /hr/DepartmentSummary - Department statistics');
    console.log('   - GET /hr/AttritionRiskSummary - Attrition risk by department');
    console.log('');
    console.log('🤖 AI-Powered Actions:');
    console.log('   - POST /hr/generateAttritionRisk - Generate attrition risk analysis');
    console.log('   - POST /hr/generateTrainingRecommendations - Get training recommendations');
    console.log('   - POST /hr/generateEngagementIdeas - Generate engagement ideas');
    console.log('   - POST /hr/analyzePolicyGaps - Analyze policy gaps');
    console.log('   - POST /hr/analyzeTeamPerformance - Analyze team performance');
    console.log('');
    console.log('📊 Sample data loaded:');
    console.log('   - 14 Employees across 6 departments');
    console.log('   - 14 Satisfaction survey responses');
    console.log('   - 14 Performance metrics records');
    console.log('   - 7 Open positions');
    console.log('   - 6 Feedback entries');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
