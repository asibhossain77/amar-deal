// ============================================================
// Amar Deal - Server Entry Point
// cPanel Username: lcmvesgt
// Domain: kikipanel.top
// এই ফাইলটি ~/amar-deal/app.js হিসেবে আপলোড করুন
// ============================================================

const path = require('path');

// ✅ আপনার cPanel তথ্য
const CPANEL_USERNAME = 'lcmvesgt';
const PORT = process.env.PORT || 3000;

process.env.NODE_ENV = 'production';

const appRoot = path.join('/home', CPANEL_USERNAME, 'amar-deal');
const standaloneDir = path.join(appRoot, '.next', 'standalone');
const dbPath = path.join(appRoot, 'db', 'custom.db');

// Standalone ডিরেক্টরিতে চেঞ্জ করুন
process.chdir(standaloneDir);

// এনভায়রনমেন্ট ভেরিয়েবল সেট
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.HOSTNAME = '0.0.0.0';

// .env ফাইল লোড করুন
try { require('dotenv').config({ path: path.join(appRoot, '.env') }); } catch(e) {}

console.log('🚀 Starting Amar Deal...');
console.log(`📁 App Root: ${appRoot}`);
console.log(`📁 Standalone: ${standaloneDir}`);
console.log(`🗄️ Database: ${dbPath}`);
console.log(`🌐 Port: ${PORT}`);

// Next.js সার্ভার স্টার্ট করুন
const { startServer } = require('next/dist/server/lib/start-server');

const nextConfig = {
  distDir: './.next',
  output: 'standalone',
};

startServer({
  dir: standaloneDir,
  isDev: false,
  config: nextConfig,
  hostname: '0.0.0.0',
  port: PORT,
  allowRetry: false,
}).then(() => {
  console.log(`✅ Amar Deal is running on port ${PORT}`);
}).catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
