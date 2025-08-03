console.log('🚀 Starting Smart HR Portal...');

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Mock data
const employees = [
  { ID: 1, FirstName: 'John', LastName: 'Smith', Role: 'Engineering Manager', Department: 'Engineering', Team: 'Backend', Location: 'New York', IsKeyTalent: 'Yes' },
  { ID: 2, FirstName: 'Sarah', LastName: 'Johnson', Role: 'Senior Developer', Department: 'Engineering', Team: 'Backend', Location: 'New York', IsKeyTalent: 'Yes' },
  { ID: 3, FirstName: 'Mike', LastName: 'Brown', Role: 'Developer', Department: 'Engineering', Team: 'Frontend', Location: 'San Francisco', IsKeyTalent: 'No' },
  { ID: 4, FirstName: 'Lisa', LastName: 'Davis', Role: 'QA Engineer', Department: 'Engineering', Team: 'Quality', Location: 'New York', IsKeyTalent: 'No' },
  { ID: 5, FirstName: 'David', LastName: 'Wilson', Role: 'HR Manager', Department: 'Human Resources', Team: 'People Ops', Location: 'Chicago', IsKeyTalent: 'Yes' },
  { ID: 6, FirstName: 'Emma', LastName: 'Taylor', Role: 'HR Specialist', Department: 'Human Resources', Team: 'Recruiting', Location: 'Chicago', IsKeyTalent: 'No' },
  { ID: 7, FirstName: 'James', LastName: 'Anderson', Role: 'Marketing Manager', Department: 'Marketing', Team: 'Digital', Location: 'Los Angeles', IsKeyTalent: 'Yes' },
  { ID: 8, FirstName: 'Anna', LastName: 'Martinez', Role: 'Marketing Specialist', Department: 'Marketing', Team: 'Content', Location: 'Los Angeles', IsKeyTalent: 'No' },
  { ID: 9, FirstName: 'Robert', LastName: 'Garcia', Role: 'Sales Manager', Department: 'Sales', Team: 'Enterprise', Location: 'Miami', IsKeyTalent: 'Yes' },
  { ID: 10, FirstName: 'Jennifer', LastName: 'Rodriguez', Role: 'Sales Representative', Department: 'Sales', Team: 'SMB', Location: 'Miami', IsKeyTalent: 'No' }
];

const server = http.createServer((req, res) => {
  console.log(`📝 ${req.method} ${req.url}`);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes
  if (req.url === '/hr/Employees') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ value: employees }));
    return;
  }

  // Serve static files
  let filePath = './app/smarthrui/webapp' + req.url;
  if (req.url === '/') {
    filePath = './app/smarthrui/webapp/index_simple.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('✅ Smart HR Portal Server Started!');
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📊 HR API: http://localhost:${PORT}/hr/Employees`);
  console.log(`📱 UI5 App: http://localhost:${PORT}`);
  console.log('🎯 Ready to use!');
});
