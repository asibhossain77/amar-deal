# ============================================================
# 🚀 Amar Deal - cPanel ডিপ্লয়মেন্ট (টার্মিনাল ছাড়া)
# ============================================================

## ❌ সমস্যা: Terminal/SSH অ্যাক্সেস নেই
## ✅ সমাধান: PHP স্ক্রিপ্ট + File Manager + Cron Job

---

## 📋 পদ্ধতি সারসংক্ষেপ

| পদ্ধতি | কী লাগে | কঠিনতা |
|---------|---------|---------|
| **A. PHP স্ক্রিপ্ট** | cPanel File Manager | ⭐ সহজ |
| **B. Cron Job** | cPanel Cron Jobs | ⭐⭐ মাঝারি |
| **C. লোকাল বিল্ড + আপলোড** | নিজের কম্পিউটার | ⭐⭐⭐ কিছুটা কঠিন |

---

## 🅰️ পদ্ধতি A: PHP স্ক্রিপ্ট দিয়ে (সবচেয়ে সহজ) ⭐

### ধাপ ১: ফাইল আপলোড করুন

**cPanel → File Manager** দিয়ে আপনার পুরো প্রজেক্ট আপলোড করুন:

1. প্রজেক্ট ZIP করুন
2. File Manager → `/home/yourusername/amar-deal/` এ আপলোড করুন
3. Extract করুন

### ধাপ ২: PHP স্ক্রিপ্ট আপলোড করুন

এই ৩টি PHP ফাইল আপলোড করুন:

| ফাইল | কোথায় | কাজ |
|-------|---------|------|
| `start-server.php` | `~/amar-deal/start-server.php` | সার্ভার চালু/বন্ধ/রিস্টার্ট |
| `build.php` | `~/amar-deal/build.php` | বিল্ড ও ইনস্টল |
| `cron-start.php` | `~/amar-deal/cron-start.php` | অটো রিস্টার্ট |

### ধাপ ৩: কনফিগারেশন

প্রতিটি PHP ফাইলে এই দুটি পরিবর্তন করুন (File Manager → Edit):

```php
$CPANEL_USER = 'your_cpanel_username'; // ← আপনার cPanel ইউজারনেম
$SECRET_CODE = 'amar-deal-2024';        // ← নতুন সিক্রেট কোড দিন
```

`.env` ফাইলও তৈরি করুন (`~/amar-deal/.env`):
```
DATABASE_URL=file:/home/your_cpanel_username/amar-deal/db/custom.db
NEXTAUTH_SECRET=আপনার-র‍্যান্ডম-সিক্রেট
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

`app.js` ফাইলও তৈরি করুন (`~/amar-deal/app.js`)

### ধাপ ৪: .htaccess সেটআপ

`~/public_html/.htaccess` ফাইল এডিট করুন:

```apache
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
</IfModule>
```

### ধাপ ৫: ব্রাউজারে সেটআপ করুন

1. **প্রথমে সিস্টেম চেক:**
   ```
   https://yourdomain.com/build.php?key=amar-deal-2024&step=check
   ```
   → Node.js আছে কিনা দেখুন

2. **তারপর ধাপে ধাপে ক্লিক করুন:**
   - `npm install` → Dependencies ইনস্টল
   - `Prisma Setup` → ডাটাবেজ তৈরি
   - `Build` → প্রোডাকশন বিল্ড
   - `Seed DB` → ডাটা সিড

3. **সার্ভার স্টার্ট করুন:**
   ```
   https://yourdomain.com/start-server.php?key=amar-deal-2024&action=start
   ```

4. **সার্ভার ম্যানেজ করুন:**
   ```
   https://yourdomain.com/start-server.php?key=amar-deal-2024
   ```
   → এখান থেকে Start/Stop/Restart করতে পারবেন

---

## 🅱️ পদ্ধতি B: Cron Job দিয়ে অটো-স্টার্ট

সার্ভার ক্র্যাশ হলে বা সার্ভার রিবুট হলে অটো চালু হবে:

1. **cPanel → Cron Jobs**
2. **Add New Cron Job**:
   - **Common Settings**: Every 5 minutes
   - **Command**:
     ```
     php /home/your_cpanel_username/amar-deal/cron-start.php
     ```
3. **Add** ক্লিক করুন

এখন প্রতি ৫ মিনিটে চেক করবে — সার্ভার বন্ধ থাকলে অটো চালু করবে!

---

## 🅲️ পদ্ধতি C: লোকালে বিল্ড → আপলোড

যদি সার্ভারে Node.js না থাকে:

### আপনার কম্পিউটারে:
```bash
# প্রজেক্ট ক্লোন করুন
git clone <repo-url>
cd amar-deal

# ইনস্টল ও বিল্ড
npm install
npx prisma generate
npx prisma db push
npm run build

# স্ট্যাটিক ফাইল কপি
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# ডাটাবেজ সিড
npm run db:seed
```

### তারপর আপলোড করুন:
এই ফাইল/ফোল্ডারগুলো cPanel File Manager দিয়ে আপলোড করুন:

```
~/amar-deal/
├── app.js                    ← এন্ট্রি পয়েন্ট
├── .env                      ← এনভায়রনমেন্ট
├── .next/standalone/         ← বিল্ড ফাইল (পুরো ফোল্ডার)
├── db/custom.db              ← ডাটাবেজ
├── prisma/                   ← Schema
├── start-server.php          ← PHP ম্যানেজার
├── cron-start.php            ← অটো স্টার্ট
└── package.json
```

> ⚠️ **গুরুত্বপূর্ণ:** লোকাল কম্পিউটার আর সার্ভারের OS একই হতে হবে 
> (উভয়ই Linux হলে ভালো)। Windows-এ বিল্ড করলে Linux সার্ভারে 
> কিছু native modules কাজ নাও করতে পারে।

---

## 🔒 নিরাপত্তা

1. **সিক্রেট কোড পরিবর্তন করুন** — `$SECRET_CODE` অবশ্যই পরিবর্তন করুন!
2. **build.php** ব্যবহারের পর মুছে ফেলুন বা rename করুন
3. **start-server.php** শুধু আপনার জানা URL দিয়ে অ্যাক্সেস করুন

---

## ❓ যদি Node.js সার্ভারে না থাকে

যদি `build.php?step=check` এ Node.js না পাওয়া যায়:

### অপশন ১: হোস্টিং প্রোভাইডারে রিকোয়েস্ট করুন
> "আমার Node.js 18+ ইনস্টল করা দরকার। অনুগ্রহ করে SSH/terminal অ্যাক্সেস দিন অথবা Node.js ইনস্টল করে দিন।"

### অপশন ২: VPS হোস্টিং নিন
- **DigitalOcean** ($4/মাস) — Terminal সুবিধা
- **Vultr** ($2.50/মাস) — Terminal সুবিধা
- **Hetzner** (€3.29/মাস) — Terminal সুবিধা
- **Hostinger VPS** ($3.99/মাস)

### অপশন ৩: Vercel-এ ফ্রি ডিপ্লয়
> Next.js এর জন্য Vercel সবচেয়ে ভালো — ফ্রি, Terminal লাগে না!
> https://vercel.com

---

## 📌 দ্রুত চেকলিস্ট

- [ ] প্রজেক্ট ফাইল File Manager দিয়ে আপলোড
- [ ] `app.js` তৈরি ও কনফিগার
- [ ] `.env` তৈরি ও কনফিগার
- [ ] `start-server.php` আপলোড
- [ ] `build.php` আপলোড  
- [ ] `cron-start.php` আপলোড
- [ ] `.htaccess` সেটআপ
- [ ] `build.php` দিয়ে সিস্টেম চেক
- [ ] `build.php` দিয়ে npm install
- [ ] `build.php` দিয়ে Prisma setup
- [ ] `build.php` দিয়ে Build
- [ ] `start-server.php` দিয়ে সার্ভার স্টার্ট
- [ ] Cron Job সেটআপ (অটো রিস্টার্ট)
- [ ] ব্রাউজারে টেস্ট ✅
