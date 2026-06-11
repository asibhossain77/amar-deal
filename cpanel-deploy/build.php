<?php
// ============================================================
// Amar Deal - টার্মিনাল ছাড়া বিল্ড স্ক্রিপ্ট
// cPanel Username: lcmvesgt
// Domain: kikipanel.top
// এই ফাইলটি ~/amar-deal/build.php হিসেবে আপলোড করুন
// ব্রাউজারে: https://kikipanel.top/build.php?key=amar-deal-2024
// ============================================================

$SECRET = 'amar-deal-2024';
if (!isset($_GET['key']) || $_GET['key'] !== $SECRET) { die('⛔ Access Denied'); }

$CPANEL_USER = 'lcmvesgt';
$APP_DIR = "/home/$CPANEL_USER/amar-deal";
$step = $_GET['step'] ?? 'menu';

// Node/npm/npx পথ
$nodePath = $npmPath = $npxPath = null;
foreach (['/usr/bin/node','/usr/local/bin/node',"/home/$CPANEL_USER/nodevenv/amar-deal/18/bin/node","/home/$CPANEL_USER/nodevenv/amar-deal/20/bin/node",'/opt/cpanel/ea-nodejs18/bin/node','/opt/cpanel/ea-nodejs20/bin/node'] as $p) { if (file_exists($p)) { $nodePath=$p; break; } }
foreach (['/usr/bin/npm','/usr/local/bin/npm',"/home/$CPANEL_USER/nodevenv/amar-deal/18/bin/npm",'/opt/cpanel/ea-nodejs18/bin/npm'] as $p) { if (file_exists($p)) { $npmPath=$p; break; } }
foreach (['/usr/bin/npx','/usr/local/bin/npx',"/home/$CPANEL_USER/nodevenv/amar-deal/18/bin/npx",'/opt/cpanel/ea-nodejs18/bin/npx'] as $p) { if (file_exists($p)) { $npxPath=$p; break; } }

?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amar Deal - Build Manager</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:#1a1a2e;color:#eee;padding:20px}
        .container{max-width:800px;margin:0 auto}
        h1{color:#6BBF59;text-align:center;margin-bottom:20px}
        .card{background:#16213e;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #0f3460}
        .card h2{color:#6BBF59;margin-bottom:12px}
        pre{background:#0a0a1a;padding:15px;border-radius:8px;overflow-x:auto;font-size:12px;max-height:400px;overflow-y:auto;color:#aaffaa;white-space:pre-wrap}
        .btn{display:inline-block;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;text-decoration:none;margin:4px;color:#fff}
        .btn-green{background:#6BBF59} .btn-blue{background:#3498db} .btn-orange{background:#e67e22}
        .btn:hover{opacity:.85}
        .ok{color:#6BBF59} .err{color:#e74c3c} .warn{color:#e67e22}
    </style>
</head>
<body>
<div class="container">
    <h1>🔧 Amar Deal - Build Manager</h1>
<?php

if ($step === 'check') {
    echo '<div class="card"><h2>🔍 সিস্টেম চেক</h2><ul style="margin-left:20px;line-height:2.2">';
    echo '<li>Node.js: ' . ($nodePath ? "<span class='ok'>✅ $nodePath (".trim(shell_exec("$nodePath --version 2>/dev/null")).")</span>" : '<span class="err">❌ পাওয়া যায়নি</span>') . '</li>';
    echo '<li>npm: ' . ($npmPath ? "<span class='ok'>✅ $npmPath (".trim(shell_exec("$npmPath --version 2>/dev/null")).")</span>" : '<span class="err">❌ পাওয়া যায়নি</span>') . '</li>';
    echo '<li>npx: ' . ($npxPath ? "<span class='ok'>✅ $npxPath</span>" : '<span class="err">❌ পাওয়া যায়নি</span>') . '</li>';
    echo '<li>PHP: <span class="ok">✅ ' . PHP_VERSION . '</span></li>';
    echo '<li>shell_exec: ' . (function_exists('shell_exec') ? '<span class="ok">✅</span>' : '<span class="err">❌ Disabled</span>') . '</li>';
    echo '<li>App Dir: ' . (is_dir($APP_DIR) ? '<span class="ok">✅</span>' : '<span class="err">❌</span>') . '</li>';
    echo '<li>node_modules: ' . (is_dir("$APP_DIR/node_modules") ? '<span class="ok">✅</span>' : '<span class="warn">⚠️</span>') . '</li>';
    echo '<li>Standalone: ' . (is_dir("$APP_DIR/.next/standalone") ? '<span class="ok">✅</span>' : '<span class="warn">⚠️</span>') . '</li>';
    echo '<li>Database: ' . (file_exists("$APP_DIR/db/custom.db") ? '<span class="ok">✅</span>' : '<span class="warn">⚠️</span>') . '</li>';
    echo '<li>.env: ' . (file_exists("$APP_DIR/.env") ? '<span class="ok">✅</span>' : '<span class="err">❌</span>') . '</li>';
    echo '<li>app.js: ' . (file_exists("$APP_DIR/app.js") ? '<span class="ok">✅</span>' : '<span class="err">❌</span>') . '</li>';
    echo '</ul></div>';
}

elseif ($step === 'install') {
    echo '<div class="card"><h2>📦 npm install</h2>';
    if (!$npmPath) { echo '<p class="err">❌ npm পাওয়া যায়নি!</p>'; }
    else {
        set_time_limit(300);
        echo '<p>ইনস্টল চলছে...</p>';
        $out = shell_exec("cd $APP_DIR && $npmPath install 2>&1");
        echo '<pre>' . htmlspecialchars($out) . '</pre>';
        echo is_dir("$APP_DIR/node_modules") ? '<p class="ok">✅ সম্পন্ন!</p>' : '<p class="err">❌ সমস্যা</p>';
    }
    echo '</div>';
}

elseif ($step === 'prisma') {
    echo '<div class="card"><h2>🗄️ Prisma Setup</h2>';
    if (!$npxPath) { echo '<p class="err">❌ npx পাওয়া যায়নি!</p>'; }
    else {
        set_time_limit(120);
        echo '<p>Prisma generate...</p>';
        echo '<pre>' . htmlspecialchars(shell_exec("cd $APP_DIR && $npxPath prisma generate 2>&1")) . '</pre>';
        echo '<p>DB push...</p>';
        echo '<pre>' . htmlspecialchars(shell_exec("cd $APP_DIR && $npxPath prisma db push 2>&1")) . '</pre>';
        echo file_exists("$APP_DIR/db/custom.db") ? '<p class="ok">✅ ডাটাবেজ তৈরি!</p>' : '<p class="err">❌ সমস্যা</p>';
    }
    echo '</div>';
}

elseif ($step === 'build') {
    echo '<div class="card"><h2>🏗️ Next.js Build</h2>';
    if (!$npmPath) { echo '<p class="err">❌ npm পাওয়া যায়নি!</p>'; }
    else {
        set_time_limit(600);
        echo '<p>বিল্ড চলছে... (৫-১০ মিনিট লাগতে পারে)</p>';
        $out = shell_exec("cd $APP_DIR && $npmPath run build 2>&1");
        echo '<pre>' . htmlspecialchars($out) . '</pre>';
        if (is_dir("$APP_DIR/.next/standalone")) {
            echo '<p class="ok">✅ বিল্ড সফল!</p>';
            shell_exec("cp -r $APP_DIR/.next/static $APP_DIR/.next/standalone/.next/ 2>&1");
            shell_exec("cp -r $APP_DIR/public $APP_DIR/.next/standalone/ 2>&1");
            echo '<p class="ok">✅ স্ট্যাটিক ফাইল কপি সম্পন্ন!</p>';
        } else {
            echo '<p class="err">❌ বিল্ডে সমস্যা</p>';
        }
    }
    echo '</div>';
}

elseif ($step === 'seed') {
    echo '<div class="card"><h2>🌱 Seed Database</h2>';
    if (!$npmPath) { echo '<p class="err">❌ npm পাওয়া যায়নি!</p>'; }
    else {
        set_time_limit(120);
        echo '<pre>' . htmlspecialchars(shell_exec("cd $APP_DIR && $npmPath run db:seed 2>&1")) . '</pre>';
    }
    echo '</div>';
}

?>
    <div class="card">
        <h2>📋 ধাপে ধাপে সেটআপ</h2>
        <p style="margin-bottom:16px;color:#aaa">ক্রমানুসারে ক্লিক করুন:</p>
        <div style="text-align:center">
            <a href="?step=check&key=<?php echo $SECRET; ?>" class="btn btn-blue">🔍 ০. সিস্টেম চেক</a>
        </div>
        <div style="text-align:center;margin-top:8px">
            <a href="?step=install&key=<?php echo $SECRET; ?>" class="btn btn-green">📦 ১. npm install</a>
        </div>
        <div style="text-align:center;margin-top:8px">
            <a href="?step=prisma&key=<?php echo $SECRET; ?>" class="btn btn-green">🗄️ ২. Prisma Setup</a>
        </div>
        <div style="text-align:center;margin-top:8px">
            <a href="?step=build&key=<?php echo $SECRET; ?>" class="btn btn-orange">🏗️ ৩. Build</a>
        </div>
        <div style="text-align:center;margin-top:8px">
            <a href="?step=seed&key=<?php echo $SECRET; ?>" class="btn btn-green">🌱 ৪. Seed DB</a>
        </div>
    </div>

    <div class="card">
        <h2>⚠️ গুরুত্বপূর্ণ</h2>
        <ul style="margin-left:20px;line-height:2">
            <li>প্রথমে <b>সিস্টেম চেক</b> করুন</li>
            <li>Node.js না থাকলে এই পদ্ধতি কাজ করবে না</li>
            <li>সেক্ষেত্রে লোকালে বিল্ড করে আপলোড করতে হবে</li>
            <li class="err">সিক্রেট কোড পরিবর্তন করুন!</li>
        </ul>
    </div>
</div>
</body>
</html>
