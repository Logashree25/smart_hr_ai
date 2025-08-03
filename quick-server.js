const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'app/smarthrui/webapp')));

// Employee data with Key Talent
const employees = [
  { ID: 1, FirstName: 'John', LastName: 'Smith', Role: 'Engineering Manager', Department: 'Engineering', IsKeyTalent: true },
  { ID: 2, FirstName: 'Sarah', LastName: 'Johnson', Role: 'Senior Developer', Department: 'Engineering', IsKeyTalent: true },
  { ID: 3, FirstName: 'Mike', LastName: 'Brown', Role: 'Developer', Department: 'Engineering', IsKeyTalent: false },
  { ID: 4, FirstName: 'Lisa', LastName: 'Davis', Role: 'QA Engineer', Department: 'Engineering', IsKeyTalent: false },
  { ID: 5, FirstName: 'David', LastName: 'Wilson', Role: 'HR Manager', Department: 'Human Resources', IsKeyTalent: true },
  { ID: 6, FirstName: 'Emma', LastName: 'Taylor', Role: 'HR Specialist', Department: 'Human Resources', IsKeyTalent: false },
  { ID: 7, FirstName: 'James', LastName: 'Anderson', Role: 'Marketing Manager', Department: 'Marketing', IsKeyTalent: true },
  { ID: 8, FirstName: 'Anna', LastName: 'Martinez', Role: 'Marketing Specialist', Department: 'Marketing', IsKeyTalent: false },
  { ID: 9, FirstName: 'Robert', LastName: 'Garcia', Role: 'Sales Manager', Department: 'Sales', IsKeyTalent: true },
  { ID: 10, FirstName: 'Jennifer', LastName: 'Rodriguez', Role: 'Sales Representative', Department: 'Sales', IsKeyTalent: false }
];

const departments = [
  { Department: 'Engineering', EmployeeCount: 4, KeyTalentCount: 2 },
  { Department: 'Human Resources', EmployeeCount: 2, KeyTalentCount: 1 },
  { Department: 'Marketing', EmployeeCount: 2, KeyTalentCount: 1 },
  { Department: 'Sales', EmployeeCount: 2, KeyTalentCount: 1 }
];

// API routes
app.get('/hr/Employees', (req, res) => {
  console.log('📊 Serving employees data');
  res.json({ value: employees });
});

app.get('/hr/DepartmentSummary', (req, res) => {
  console.log('📈 Serving department summary');
  res.json({ value: departments });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/smarthrui/webapp/index_simple.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Smart HR Portal Server Started Successfully!');
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📊 HR API: http://localhost:${PORT}/hr/Employees`);
  console.log(`📱 UI5 App: http://localhost:${PORT}`);
  console.log('✅ Ready to use!');
});

console.log('Starting Smart HR Portal server...');
