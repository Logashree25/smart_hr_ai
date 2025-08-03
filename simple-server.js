const express = require('express');
const path = require('path');

const app = express();
const PORT = 8090;

console.log('Starting Smart HR Portal Server...');

// Enable CORS
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

// Parse JSON bodies
app.use(express.json());

// Serve UI5 app first (before static files)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/smarthrui/webapp/index_simple.html'));
});

// Serve static files (after the root route)
app.use(express.static(path.join(__dirname, 'app/smarthrui/webapp')));

// Mock HR data
let employees = [
  { ID: 1, EmployeeID: 'AE908', FirstName: 'John', LastName: 'Smith', Role: 'Engineering Manager', Department: 'Engineering', Team: 'Backend', Location: 'New York', HireDate: '2020-01-15', HireType: 'Full-time', TenureMonths: 48, IsKeyTalent: true },
  { ID: 2, EmployeeID: 'AE892', FirstName: 'Sarah', LastName: 'Johnson', Role: 'Senior Developer', Department: 'Engineering', Team: 'Backend', Location: 'New York', HireDate: '2019-03-22', HireType: 'Full-time', TenureMonths: 58, IsKeyTalent: true },
  { ID: 3, EmployeeID: 'AE445', FirstName: 'Mike', LastName: 'Brown', Role: 'Developer', Department: 'Engineering', Team: 'Frontend', Location: 'San Francisco', HireDate: '2021-06-10', HireType: 'Contract', TenureMonths: 31, IsKeyTalent: false },
  { ID: 4, EmployeeID: 'AE223', FirstName: 'Lisa', LastName: 'Davis', Role: 'QA Engineer', Department: 'Engineering', Team: 'Quality', Location: 'New York', HireDate: '2020-09-05', HireType: 'Full-time', TenureMonths: 40, IsKeyTalent: false },
  { ID: 5, EmployeeID: 'AE156', FirstName: 'David', LastName: 'Wilson', Role: 'HR Manager', Department: 'Human Resources', Team: 'People Ops', Location: 'Chicago', HireDate: '2018-11-12', HireType: 'Full-time', TenureMonths: 62, IsKeyTalent: true },
  { ID: 6, EmployeeID: 'AE789', FirstName: 'Emma', LastName: 'Taylor', Role: 'HR Specialist', Department: 'Human Resources', Team: 'Recruiting', Location: 'Chicago', HireDate: '2021-02-28', HireType: 'Contract', TenureMonths: 34, IsKeyTalent: false },
  { ID: 7, EmployeeID: 'AE334', FirstName: 'James', LastName: 'Anderson', Role: 'Marketing Manager', Department: 'Marketing', Team: 'Digital', Location: 'Los Angeles', HireDate: '2019-07-18', HireType: 'Full-time', TenureMonths: 53, IsKeyTalent: true },
  { ID: 8, EmployeeID: 'AE567', FirstName: 'Anna', LastName: 'Martinez', Role: 'Marketing Specialist', Department: 'Marketing', Team: 'Content', Location: 'Los Angeles', HireDate: '2020-12-03', HireType: 'Contract', TenureMonths: 37, IsKeyTalent: false },
  { ID: 9, EmployeeID: 'AE912', FirstName: 'Robert', LastName: 'Garcia', Role: 'Sales Manager', Department: 'Sales', Team: 'Enterprise', Location: 'Miami', HireDate: '2018-04-25', HireType: 'Full-time', TenureMonths: 69, IsKeyTalent: true },
  { ID: 10, EmployeeID: 'AE445', FirstName: 'Jennifer', LastName: 'Rodriguez', Role: 'Sales Representative', Department: 'Sales', Team: 'SMB', Location: 'Miami', HireDate: '2021-08-14', HireType: 'Full-time', TenureMonths: 28, IsKeyTalent: false }
];

// Helper function to generate next ID
function getNextEmployeeId() {
  return Math.max(...employees.map(e => e.ID)) + 1;
}

// Helper function to generate Employee ID
function generateEmployeeId() {
  return 'AE' + Math.floor(Math.random() * 900 + 100);
}

const departments = [
  { Department: 'Engineering', EmployeeCount: 4, KeyTalentCount: 2 },
  { Department: 'Human Resources', EmployeeCount: 2, KeyTalentCount: 1 },
  { Department: 'Marketing', EmployeeCount: 2, KeyTalentCount: 1 },
  { Department: 'Sales', EmployeeCount: 2, KeyTalentCount: 1 }
];

// API Routes

// Search Employees (must come before general /hr/Employees route)
app.get('/hr/Employees/search', (req, res) => {
  try {
    const searchTerm = req.query.q ? req.query.q.toLowerCase() : '';

    if (!searchTerm) {
      return res.json({ value: employees });
    }

    const filteredEmployees = employees.filter(emp =>
      emp.FirstName.toLowerCase().includes(searchTerm) ||
      emp.LastName.toLowerCase().includes(searchTerm) ||
      emp.EmployeeID.toLowerCase().includes(searchTerm) ||
      emp.Role.toLowerCase().includes(searchTerm) ||
      emp.Department.toLowerCase().includes(searchTerm) ||
      emp.Team.toLowerCase().includes(searchTerm) ||
      emp.Location.toLowerCase().includes(searchTerm)
    );

    res.json({ value: filteredEmployees });
  } catch (error) {
    res.status(400).json({ error: 'Search failed', details: error.message });
  }
});

app.get('/hr/Employees', (req, res) => {
  res.json({ value: employees });
});

app.get('/hr/DepartmentSummary', (req, res) => {
  res.json({ value: departments });
});

app.post('/hr/generateAttritionRisk', (req, res) => {
  res.json({ value: 'AI analysis complete: Low risk detected for selected employee.' });
});

app.post('/hr/analyzeTeamPerformance', (req, res) => {
  res.json({ value: 'Team performance analysis: Above average performance with 85% goal completion rate.' });
});

app.get('/genai/getEngagementIdeas', (req, res) => {
  res.json({ value: 'AI Engagement Ideas: 1) Team building activities 2) Flexible work arrangements 3) Professional development programs' });
});

app.post('/hr/analyzePolicyGaps', (req, res) => {
  res.json({ value: 'Policy Gap Analysis: 1) Remote work policy needs updating 2) Performance review process could be streamlined 3) Employee wellness programs need expansion' });
});

// CRUD Operations for Employees

// Create Employee
app.post('/hr/Employees', (req, res) => {
  try {
    const newEmployee = {
      ID: getNextEmployeeId(),
      EmployeeID: generateEmployeeId(),
      FirstName: req.body.FirstName || '',
      LastName: req.body.LastName || '',
      Role: req.body.Role || '',
      Department: req.body.Department || '',
      Team: req.body.Team || '',
      Location: req.body.Location || '',
      HireDate: req.body.HireDate || new Date().toISOString().split('T')[0],
      HireType: req.body.HireType || 'Full-time',
      TenureMonths: req.body.TenureMonths || 0,
      IsKeyTalent: req.body.IsKeyTalent || false
    };
    employees.push(newEmployee);
    res.json({ value: newEmployee, message: 'Employee created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create employee', details: error.message });
  }
});

// Update Employee
app.put('/hr/Employees/:id', (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employeeIndex = employees.findIndex(emp => emp.ID === employeeId);

    if (employeeIndex === -1) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update employee with provided fields
    const updatedEmployee = { ...employees[employeeIndex], ...req.body };
    employees[employeeIndex] = updatedEmployee;

    res.json({ value: updatedEmployee, message: 'Employee updated successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update employee', details: error.message });
  }
});

// Delete Employee
app.delete('/hr/Employees/:id', (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employeeIndex = employees.findIndex(emp => emp.ID === employeeId);

    if (employeeIndex === -1) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const deletedEmployee = employees.splice(employeeIndex, 1)[0];
    res.json({ value: deletedEmployee, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete employee', details: error.message });
  }
});



app.listen(PORT, () => {
  console.log('🚀 Smart HR Portal Server Started!');
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📊 HR API: http://localhost:${PORT}/hr/Employees`);
  console.log(`📱 UI5 App: http://localhost:${PORT}`);
  console.log('✅ Ready to use!');
}).on('error', (err) => {
  console.error('Server error:', err);
});
