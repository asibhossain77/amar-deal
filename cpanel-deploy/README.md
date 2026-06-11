# 🚀 Amar Deal - cPanel ডিপ্লয়মেন্ট গাইড
## (Setup Node.js App ছাড়া)

---

## ❌ সমস্যা: "Setup Node.js App" কাজ করছে না

## ✅ সমাধান: `nohup` + Apache `.htaccess` Proxy দিয়ে রান করুন

---

## 📋 যা যা লাগবে

- cPanel SSH/Terminal অ্যাক্সেস
- Node.js 18+ (সার্ভারে ইনস্টল থাকতে হবে)
- আপনার ডোমেইন

---

## 📁 ফাইল স্ট্রাকচার

```
/home/yourusername/
├── amar-deal/                        ← মূল প্রজেক্ট
│   ├── app.js                        ← ⭐ সার্ভার এন্ট্রি পয়েন্ট
│   ├── .env                          ← এনভায়রনমেন্ট ভেরিয়েবল
│   ├── start.sh                      ← সার্ভার স্টার্ট স্ক্রিপ্ট
│   ├── stop.sh                       ← সার্ভার স্টপ স্ক্রিপ্ট
│   ├── package.json
│   ├── server.pid                    ← (অটো তৈরি হবে)
│   ├── logs/
│   │   └── server.log                ← (অটো তৈরি হবে)
│   ├── .next/
│   │   ├── standalone/               ← প্রোডাকশন বিল্ড
│   │   │   ├── .next/
│   │   │   ├── node_modules/
│   │   │   ├── public/
│   │   │   └── server.js
│   │   └── static/
│   ├── db/
│   │   └── custom.db                 ← SQLite ডাটাবেজ
│   ├── prisma/
│   │   └── schema.prisma
│   └── public/
│
└── public_html/
    └── .htaccess                     ← ⭐ Apache Proxy কনফিগ
```

---

## 🔧 ধাপে ধাপে সেটআপ

### ধাপ ১: cPanel Terminal ওপেন করুন

cPanel Dashboard → **Advanced** → **Terminal**

### ধাপ ২: প্রজেক্ট আপলোড করুন

```bash
# Git দিয়ে ক্লোন
cd ~
git clone <your-repo-url> amar-deal
cd amar-deal
```

অথবা File Manager দিয়ে ZIP আপলোড করে Extract করুন।

### ধাপ ৩: Dependencies ইনস্টল ও বিল্ড

```bash
cd ~/amar-deal
npm install
npx prisma generate
npx prisma db push
npm run build

# স্ট্যাটিক ফাইল কপি (গুরুত্বপূর্ণ!)
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Logs ডিরেক্টরি তৈরি
mkdir -p logs
```

### ধাপ ৪: কনফিগারেশন ফাইল

#### ৪.১: `app.js` - সার্ভার এন্ট্রি পয়েন্ট

`~/amar-deal/app.js` ফাইল তৈরি করুন এবং **`your_cpanel_username`** পরিবর্তন করুন:

```javascript
const path = require('path');

// ⚠️ আপনার cPanel ইউজারনেম দিন
const CPANEL_USERNAME = 'your_cpanel_username';
const PORT = process.env.PORT || 3000;

process.env.NODE_ENV = 'production';

const appRoot = path.join('/home', CPANEL_USERNAME, 'amar-deal');
const standaloneDir = path.join(appRoot, '.next', 'standalone');
const dbPath = path.join(appRoot, 'db', 'custom.db');

process.chdir(standaloneDir);
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.HOSTNAME = '0.0.0.0';

// Load .env
try { require('dotenv').config({ path: path.join(appRoot, '.env') }); } catch(e) {}

const { startServer } = require('next/dist/server/lib/start-server');

startServer({
  dir: standaloneDir,
  isDev: false,
  config: { distDir: './.next', output: 'standalone' },
  hostname: '0.0.0.0',
  port: PORT,
  allowRetry: false,
}).catch((err) => { console.error(err); process.exit(1); });
```

#### ৪.২: `.env` ফাইল

`~/amar-deal/.env` ফাইল তৈরি/এডিট করুন:

```env
DATABASE_URL=file:/home/your_cpanel_username/amar-deal/db/custom.db
NEXTAUTH_SECRET=আপনার-র‍্যান্ডম-সিক্রেট-কী
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

**NEXTAUTH_SECRET জেনারেট করুন:**
```bash
openssl rand -base64 32
```

#### ৪.৩: `.htaccess` ফাইল

`~/public_html/.htaccess` ফাইল তৈরি/এডিট করুন:

```apache
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
</IfModule>

<IfModule !mod_proxy.c>
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
    </IfModule>
</IfModule>
```

### ধাপ ৫: সার্ভার স্টার্ট করুন

#### পদ্ধতি ১: ম্যানুয়ালি (সবচেয়ে সহজ)

```bash
cd ~/amar-deal
nohup node app.js > logs/server.log 2>&1 &
echo $! > server.pid
```

#### পদ্ধতি ২: start.sh দিয়ে

```bash
bash ~/amar-deal/start.sh
```

#### পদ্ধতি ৩: PM2 দিয়ে (সবচেয়ে স্থিতিশীল) ⭐

```bash
npm install -g pm2
cd ~/amar-deal
pm2 start app.js --name "amar-deal"
pm2 save
pm2 startup
```

### ধাপ ৬: টেস্ট করুন

```bash
# লগ দেখুন
tail -f ~/amar-deal/logs/server.log

# পোর্ট চেক
lsof -i:3000

# লোকাল টেস্ট
curl http://127.0.0.1:3000
```

ব্রাউজারে আপনার ডোমেইন ভিজিট করুন → ✅ ওয়েবসাইট দেখাবে!

---

## 🛠️ দরকারী কমান্ড

| কাজ | কমান্ড |
|------|---------|
| সার্ভার স্টার্ট | `cd ~/amar-deal && nohup node app.js > logs/server.log 2>&1 &` |
| সার্ভার স্টপ | `kill $(cat ~/amar-deal/server.pid)` |
| লগ দেখুন | `tail -f ~/amar-deal/logs/server.log` |
| রিস্টার্ট | `kill $(cat ~/amar-deal/server.pid) && cd ~/amar-deal && nohup node app.js > logs/server.log 2>&1 &` |
| স্ট্যাটাস চেক | `lsof -i:3000` |

---

## 🐛 সমস্যা সমাধান

| সমস্যা | সমাধান |
|---------|---------|
| 502 Bad Gateway | Node.js চলছে কিনা চেক: `lsof -i:3000` |
| 503 Service Unavailable | `.htaccess` প্রপার কনফিগ করুন |
| পেজ লোড হচ্ছে না | `logs/server.log` দেখুন |
| Static files 404 | `cp -r` কমান্ড আবার চালান |
| Database error | `.env` এ absolute path দিন |
| Port busy | `kill $(lsof -ti:3000)` দিয়ে ফ্রি করুন |

---

## ⚠️ গুরুত্বপূর্ণ নোট

1. **`your_cpanel_username`** সব ফাইলে পরিবর্তন করুন
2. **NEXTAUTH_SECRET** অবশ্যই পরিবর্তন করুন
3. **NEXTAUTH_URL** আপনার ডোমেইন দিন
4. সার্ভার রিবুট হলে আবার `start.sh` চালাতে হবে (PM2 ব্যবহার করলে অটো স্টার্ট)
5. SQLite ডাটাবেজ ব্যাকআপ রাখুন
