<?php
// ============================================================
// 🚀 Amar Deal - PHP Server Manager
// cPanel Username: lcmvesgt
// Domain: kikipanel.top
// এই ফাইলটি ~/amar-deal/start-server.php হিসেবে আপলোড করুন
// ব্রাউজারে: https://kikipanel.top/start-server.php?key=amar-deal-2024
// ============================================================

// 🔒 সিক্রেট কোড (নিরাপত্তার জন্য পরিবর্তন করুন!)
$SECRET_CODE = 'amar-deal-2024';

if (!isset($_GET['key']) || $_GET['key'] !== $SECRET_CODE) {
    http_response_code(403);
    die('⛔ Access Denied');
}

$CPANEL_USER = 'lcmvesgt';
$APP_DIR = "/home/$CPANEL_USER/amar-deal";
$PORT = 3000;
$LOG_FILE = "$APP_DIR/logs/server.log";
$PID_FILE = "$APP_DIR/server.pid";
$action = $_GET['action'] ?? 'menu';

// Node.js পথ খুঁজুন
$nodePaths = [
    '/usr/bin/node',
    '/usr/local/bin/node',
    "/home/$CPANEL_USER/nodevenv/amar-deal/18/bin/node",
    "/home/$CPANEL_USER/nodevenv/amar-deal/20/bin/node",
    '/opt/cpanel/ea-nodejs18/bin/node',
    '/opt/cpanel/ea-nodejs20/bin/node',
];
$nodePath = null;
foreach ($nodePaths as $p) {
    if (file_exists($p)) { $nodePath = $p; break; }
}

function getServerStatus($port) {
    $c = @fsockopen('127.0.0.1', $port, $e, $s, 2);
    if (is_resource($c)) { fclose($c); return true; }
    return false;
}

?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amar Deal - Server Manager</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:#1a1a2e;color:#eee;padding:20px}
        .container{max-width:700px;margin:0 auto}
        h1{color:#6BBF59;text-align:center;margin-bottom:20px}
        .card{background:#16213e;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #0f3460}
        .card h2{color:#6BBF59;margin-bottom:12px;font-size:18px}
        .btn{display:inline-block;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;text-decoration:none;margin:4px;color:#fff}
        .btn-green{background:#6BBF59} .btn-red{background:#e74c3c} .btn-blue{background:#3498db}
        .btn:hover{opacity:.85}
        pre{background:#0a0a1a;padding:15px;border-radius:8px;overflow-x:auto;font-size:13px;max-height:300px;overflow-y:auto;color:#aaffaa;white-space:pre-wrap}
        .ok{color:#6BBF59} .err{color:#e74c3c} .warn{color:#e67e22}
        .status{padding:10px 16px;border-radius:8px;margin-bottom:12px;font-weight:bold}
        .status-running{background:#1a4a1a;color:#6BBF59}
        .status-stopped{background:#4a1a1a;color:#e74c3c}
        .actions{text-align:center;margin:16px 0}
    </style>
</head>
<body>
<div class="container">
    <h1>🚀 Amar Deal - Server Manager</h1>
<?php

$isRunning = getServerStatus($PORT);
if ($isRunning) {
    echo '<div class="status status-running">✅ সার্ভার চলছে (Port: ' . $PORT . ')</div>';
} else {
    echo '<div class="status status-stopped">❌ সার্ভার বন্ধ আছে</div>';
}

// ============ START ============
if ($action === 'start') {
    echo '<div class="card"><h2>🟢 সার্ভার স্টার্ট করা হচ্ছে...</h2>';
    if ($isRunning) {
        echo '<div class="status status-running">✅ সার্ভার ইতিমধ্যে চলছে!</div>';
    } elseif (!$nodePath) {
        echo '<div class="status status-stopped">❌ Node.js পাওয়া যায়নি! হোস্টিং প্রোভাইডারে যোগাযোগ করুন।</div>';
        echo '<p>অথবা নিচের পাথগুলো চেক করুন:</p><ul style="margin-left:20px;line-height:2">';
        foreach ($nodePaths as $p) {
            $exists = file_exists($p);
            echo '<li>' . ($exists ? '<span class="ok">✅</span>' : '<span class="err">❌</span>') . " $p</li>";
        }
        echo '</ul>';
    } else {
        echo "<p class='ok'>✅ Node.js: $nodePath</p>";
        if (!is_dir("$APP_DIR/logs")) mkdir("$APP_DIR/logs", 0755, true);

        exec("lsof -ti:$PORT 2>/dev/null", $ko);
        if (!empty($ko)) { exec("kill -9 ".implode(' ',$ko)." 2>/dev/null"); sleep(1); echo '<p>🗑️ পুরানো প্রসেস kill</p>'; }

        $cmd = "cd $APP_DIR && nohup $nodePath app.js > $LOG_FILE 2>&1 & echo $!";
        exec($cmd, $out);
        $pid = trim(implode('', $out));
        if ($pid) { file_put_contents($PID_FILE, $pid); echo "<p>🚀 PID: $pid</p>"; }

        sleep(5);
        if (getServerStatus($PORT)) {
            echo '<div class="status status-running">✅ সার্ভার সফলভাবে চলছে!</div>';
        } else {
            echo '<div class="status status-stopped">⚠️ সার্ভার স্টার্ট হতে সমস্যা। লগ চেক করুন।</div>';
        }
    }
    echo '</div>';
}

// ============ STOP ============
elseif ($action === 'stop') {
    echo '<div class="card"><h2>🔴 সার্ভার স্টপ করা হচ্ছে...</h2>';
    exec("lsof -ti:$PORT 2>/dev/null", $ko);
    if (!empty($ko)) {
        exec("kill -9 ".implode(' ',$ko)." 2>/dev/null");
        echo '<div class="status status-stopped">✅ সার্ভার স্টপ করা হয়েছে</div>';
    } else {
        echo '<div class="status status-stopped">ℹ️ সার্ভার আগে থেকেই বন্ধ</div>';
    }
    if (file_exists($PID_FILE)) unlink($PID_FILE);
    echo '</div>';
}

// ============ RESTART ============
elseif ($action === 'restart') {
    echo '<div class="card"><h2>🔄 রিস্টার্ট করা হচ্ছে...</h2>';
    exec("lsof -ti:$PORT 2>/dev/null", $ko);
    if (!empty($ko)) { exec("kill -9 ".implode(' ',$ko)." 2>/dev/null"); sleep(2); echo '<p>🔴 স্টপ</p>'; }
    if ($nodePath) {
        if (!is_dir("$APP_DIR/logs")) mkdir("$APP_DIR/logs", 0755, true);
        $cmd = "cd $APP_DIR && nohup $nodePath app.js > $LOG_FILE 2>&1 & echo $!";
        exec($cmd, $out);
        sleep(5);
        if (getServerStatus($PORT)) {
            echo '<div class="status status-running">✅ রিস্টার্ট সফল!</div>';
        } else {
            echo '<div class="status status-stopped">⚠️ রিস্টার্টে সমস্যা</div>';
        }
    }
    echo '</div>';
}

// ============ LOGS ============
elseif ($action === 'logs') {
    echo '<div class="card"><h2>📋 সার্ভার লগ</h2>';
    if (file_exists($LOG_FILE)) {
        $log = file_get_contents($LOG_FILE);
        echo '<pre>' . htmlspecialchars($log) . '</pre>';
    } else {
        echo '<p>কোনো লগ ফাইল পাওয়া যায়নি</p>';
    }
    echo '</div>';
}

// ============ STATUS ============
elseif ($action === 'status') {
    echo '<div class="card"><h2>📊 সিস্টেম স্ট্যাটাস</h2>';
    echo '<ul style="margin-left:20px;line-height:2.2">';
    echo '<li>সার্ভার: ' . ($isRunning ? '<span class="ok">✅ চলছে</span>' : '<span class="err">❌ বন্ধ</span>') . '</li>';
    echo '<li>Node.js: ' . ($nodePath ? "<span class='ok'>✅ $nodePath</span>" : '<span class="err">❌ পাওয়া যায়নি</span>') . '</li>';
    echo '<li>PHP: <span class="ok">✅ ' . PHP_VERSION . '</span></li>';
    echo '<li>shell_exec: ' . (function_exists('shell_exec') ? '<span class="ok">✅ Available</span>' : '<span class="err">❌ Disabled</span>') . '</li>';
    echo '<li>App Dir: ' . (is_dir($APP_DIR) ? '<span class="ok">✅</span>' : '<span class="err">❌ পাওয়া যায়নি</span>') . '</li>';
    echo '<li>node_modules: ' . (is_dir("$APP_DIR/node_modules") ? '<span class="ok">✅</span>' : '<span class="warn">⚠️ ইনস্টল করুন</span>') . '</li>';
    echo '<li>Standalone Build: ' . (is_dir("$APP_DIR/.next/standalone") ? '<span class="ok">✅</span>' : '<span class="warn">⚠️ বিল্ড করুন</span>') . '</li>';
    echo '<li>Database: ' . (file_exists("$APP_DIR/db/custom.db") ? '<span class="ok">✅</span>' : '<span class="warn">⚠️ তৈরি করুন</span>') . '</li>';
    echo '<li>.env: ' . (file_exists("$APP_DIR/.env") ? '<span class="ok">✅</span>' : '<span class="err">❌ তৈরি করুন</span>') . '</li>';
    echo '<li>app.js: ' . (file_exists("$APP_DIR/app.js") ? '<span class="ok">✅</span>' : '<span class="err">❌ তৈরি করুন</span>') . '</li>';
    echo '</ul></div>';
}

?>

    <div class="actions">
        <a href="?action=start&key=<?php echo $SECRET_CODE; ?>" class="btn btn-green">🟢 Start</a>
        <a href="?action=stop&key=<?php echo $SECRET_CODE; ?>" class="btn btn-red">🔴 Stop</a>
        <a href="?action=restart&key=<?php echo $SECRET_CODE; ?>" class="btn btn-blue">🔄 Restart</a>
        <a href="?action=status&key=<?php echo $SECRET_CODE; ?>" class="btn btn-blue">📊 Status</a>
        <a href="?action=logs&key=<?php echo $SECRET_CODE; ?>" class="btn btn-blue">📋 Logs</a>
    </div>

    <div class="card">
        <h2>📌 দ্রুত লিংক</h2>
        <pre>https://kikipanel.top/start-server.php?key=amar-deal-2024&action=start
https://kikipanel.top/start-server.php?key=amar-deal-2024&action=stop
https://kikipanel.top/start-server.php?key=amar-deal-2024&action=restart
https://kikipanel.top/start-server.php?key=amar-deal-2024&action=status
https://kikipanel.top/start-server.php?key=amar-deal-2024&action=logs</pre>
        <p style="margin-top:10px;color:#ff6b6b">⚠️ সিক্রেট কোড পরিবর্তন করুন! ($SECRET_CODE)</p>
    </div>

</div>
</body>
</html>
