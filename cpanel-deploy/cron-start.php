<?php
// ============================================================
// Amar Deal - Cron Job Auto-Start
// cPanel Username: lcmvesgt
// Domain: kikipanel.top
// এই ফাইলটি ~/amar-deal/cron-start.php হিসেবে আপলোড করুন
// Cron Job: */5 * * * * php /home/lcmvesgt/amar-deal/cron-start.php
// ============================================================

$CPANEL_USER = 'lcmvesgt';
$APP_DIR = "/home/$CPANEL_USER/amar-deal";
$PORT = 3000;
$LOG_FILE = "$APP_DIR/logs/server.log";
$PID_FILE = "$APP_DIR/server.pid";

// চেক করুন সার্ভার চলছে কিনা
$c = @fsockopen('127.0.0.1', $PORT, $e, $s, 2);
if (is_resource($c)) { fclose($c); exit(0); } // চলছে, কিছু করার নেই

// Node.js খুঁজুন
$nodePath = null;
foreach (['/usr/bin/node','/usr/local/bin/node',"/home/$CPANEL_USER/nodevenv/amar-deal/18/bin/node","/home/$CPANEL_USER/nodevenv/amar-deal/20/bin/node",'/opt/cpanel/ea-nodejs18/bin/node','/opt/cpanel/ea-nodejs20/bin/node'] as $p) {
    if (file_exists($p)) { $nodePath=$p; break; }
}

if (!$nodePath) {
    file_put_contents($LOG_FILE, date('Y-m-d H:i:s')." - ERROR: Node.js not found\n", FILE_APPEND);
    exit(1);
}

if (!is_dir("$APP_DIR/logs")) mkdir("$APP_DIR/logs", 0755, true);

// সার্ভার স্টার্ট করুন
exec("cd $APP_DIR && nohup $nodePath app.js > $LOG_FILE 2>&1 & echo $!", $out);
$pid = trim(implode('', $out));
if ($pid) {
    file_put_contents($PID_FILE, $pid);
    file_put_contents($LOG_FILE, date('Y-m-d H:i:s')." - Server started by cron (PID: $pid)\n", FILE_APPEND);
}
