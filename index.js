const http = require('http');
const app = require('./src/app');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 SOS Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  // Check if Supabase is configured
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('\n⚠️  WARNING: Supabase credentials not configured!');
    console.warn('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
    console.warn('   See server/env.example for reference\n');
  } else {
    console.log('✅ Supabase configured\n');
  }
});

