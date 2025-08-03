const cds = require('@sap/cds');

async function start() {
  try {
    console.log('🚀 Starting Smart HR Portal...');
    
    // Load the CDS model
    const model = await cds.load('*');
    console.log('📋 Model loaded successfully');
    
    // Connect to database
    await cds.connect.to('db');
    console.log('🗄️ Database connected');
    
    // Start HTTP server
    const port = process.env.PORT || 4004;
    const server = await cds.serve('all').from('srv').in('express').at(port);
    
    console.log('✅ Smart HR Portal is running!');
    console.log(`🌐 Server: http://localhost:${port}`);
    console.log(`📊 HR Service: http://localhost:${port}/hr`);
    console.log(`🤖 GenAI Service: http://localhost:${port}/genai`);
    console.log(`📱 UI5 App: file:///home/user/projects/smart_HR_portal/app/smarthrui/webapp/index.html`);
    
    return server;
    
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Smart HR Portal...');
  process.exit(0);
});

// Start the server
start().catch(console.error);
