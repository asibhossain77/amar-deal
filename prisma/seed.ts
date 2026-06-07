import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@banglaescrow.com" },
    update: {},
    create: {
      email: "admin@banglaescrow.com",
      name: "প্রশাসক",
      password: adminPassword,
      phone: "০১৭০০০০০০০০",
      role: "admin",
      isActive: true,
    },
  });

  // Create demo buyer
  const buyerPassword = await bcrypt.hash("buyer123", 12);
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      email: "buyer@example.com",
      name: "রহিম উদ্দিন",
      password: buyerPassword,
      phone: "০১৭১২৩৪৫৬৭৮",
      role: "user",
      isActive: true,
    },
  });

  // Create demo seller
  const sellerPassword = await bcrypt.hash("seller123", 12);
  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      email: "seller@example.com",
      name: "করিম হাসান",
      password: sellerPassword,
      phone: "০১৭৯৮৭৬৫৪৩২",
      role: "user",
      isActive: true,
    },
  });

  // Create another user
  const user2Password = await bcrypt.hash("user123", 12);
  const user2 = await prisma.user.upsert({
    where: { email: "fatima@example.com" },
    update: {},
    create: {
      email: "fatima@example.com",
      name: "ফাতেমা আক্তার",
      password: user2Password,
      phone: "০১৮১২৩৪৫৬৭৮",
      role: "user",
      isActive: true,
    },
  });

  // Create sample transactions
  // t1: pending_payment - NO existing payment, so buyer can submit payment
  const t1 = await prisma.transaction.create({
    data: {
      title: "ওয়েবসাইট ডিজাইন",
      description: "একটি ই-কমার্স ওয়েবসাইট ডিজাইন ও ডেভেলপমেন্ট",
      amount: 25000,
      terms: "৩০ দিনের মধ্যে কাজ সম্পন্ন হতে হবে। রিভিশন সীমাবদ্ধ।",
      buyerId: buyer.id,
      sellerId: seller.id,
      status: "pending_payment",
    },
  });

  // t2: pending_verification - has a pending payment
  const t2 = await prisma.transaction.create({
    data: {
      title: "গ্রাফিক ডিজাইন",
      description: "সোশ্যাল মিডিয়া পোস্ট ও ব্যানার ডিজাইন",
      amount: 12000,
      terms: "১৫ দিনের মধ্যে কাজ সম্পন্ন। ২টি রিভিশন।",
      buyerId: buyer.id,
      sellerId: user2.id,
      status: "pending_verification",
    },
  });

  const t3 = await prisma.transaction.create({
    data: {
      title: "লোগো ডিজাইন",
      description: "কোম্পানির লোগো ডিজাইন",
      amount: 5000,
      terms: "৫টি কনসেপ্ট, ৩টি রিভিশন পর্যন্ত।",
      buyerId: buyer.id,
      sellerId: seller.id,
      status: "paid",
    },
  });

  const t4 = await prisma.transaction.create({
    data: {
      title: "মোবাইল অ্যাপ ডেভেলপমেন্ট",
      description: "অ্যান্ড্রয়েড ও আইওএস মোবাইল অ্যাপ",
      amount: 150000,
      terms: "৬০ দিনের মধ্যে ডেলিভারি। মাইলস্টোন অনুযায়ী পেমেন্ট।",
      buyerId: user2.id,
      sellerId: seller.id,
      status: "work_in_progress",
    },
  });

  const t5 = await prisma.transaction.create({
    data: {
      title: "কনটেন্ট রাইটিং",
      description: "ব্লগ পোস্ট এবং সোশ্যাল মিডিয়া কনটেন্ট",
      amount: 8000,
      terms: "১০টি ব্লগ পোস্ট এবং ৩০টি সোশ্যাল মিডিয়া পোস্ট।",
      buyerId: buyer.id,
      sellerId: user2.id,
      status: "completed",
    },
  });

  const t6 = await prisma.transaction.create({
    data: {
      title: "ডিজিটাল মার্কেটিং",
      description: "৩ মাসের ডিজিটাল মার্কেটিং সার্ভিস",
      amount: 45000,
      terms: "মাসিক রিপোর্ট প্রদান। পারফরম্যান্স ভিত্তিক।",
      buyerId: user2.id,
      sellerId: seller.id,
      status: "disputed",
    },
  });

  // Create payments for the pending_verification transaction (t2)
  await prisma.payment.create({
    data: {
      transactionId: t2.id,
      userId: buyer.id,
      transactionRef: "BKASH-8X5K9P2",
      paymentMethod: "bKash",
      status: "pending",
    },
  });

  // Create payments for the paid transaction (t3)
  await prisma.payment.create({
    data: {
      transactionId: t3.id,
      userId: buyer.id,
      transactionRef: "BKASH-78X5K9",
      paymentMethod: "bKash",
      status: "approved",
      adminNote: "পেমেন্ট যাচাই সফল",
    },
  });

  // Create payment for work_in_progress transaction (t4)
  await prisma.payment.create({
    data: {
      transactionId: t4.id,
      userId: user2.id,
      transactionRef: "NAGAD-45T2M7",
      paymentMethod: "Nagad",
      status: "approved",
    },
  });

  // Create payment for completed transaction (t5)
  await prisma.payment.create({
    data: {
      transactionId: t5.id,
      userId: buyer.id,
      transactionRef: "ROCKET-89R3P1",
      paymentMethod: "Rocket",
      status: "approved",
    },
  });

  // Create payment for disputed transaction (t6)
  await prisma.payment.create({
    data: {
      transactionId: t6.id,
      userId: user2.id,
      transactionRef: "BANK-12Q8W4",
      paymentMethod: "ব্যাংক ট্রান্সফার",
      status: "approved",
    },
  });

  // Create dispute for the disputed transaction
  const dispute = await prisma.dispute.create({
    data: {
      transactionId: t6.id,
      buyerId: user2.id,
      sellerId: seller.id,
      reason: "বিক্রেতা প্রতিশ্রুত সময়ে কাজ সম্পন্ন করেননি। মার্কেটিং ক্যাম্পেইনের ফলাফল সন্তোষজনক নয়।",
      status: "open",
    },
  });

  // Add dispute messages
  await prisma.disputeMessage.create({
    data: {
      disputeId: dispute.id,
      userId: user2.id,
      message: "বিক্রেতা ৩ মাসের মধ্যে কাজ সম্পন্ন করেননি। মাত্র ২ মাসের কাজ হয়েছে এবং তাও সন্তোষজনক নয়।",
    },
  });

  await prisma.disputeMessage.create({
    data: {
      disputeId: dispute.id,
      userId: seller.id,
      message: "আমি আমার কাজ সময়মতো করেছি। কিছু প্রযুক্তিগত সমস্যার কারণে বিলম্ব হয়েছে যা আমার নিয়ন্ত্রণের বাইরে ছিল।",
    },
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: buyer.id,
        transactionId: t1.id,
        title: "নতুন লেনদেন তৈরি হয়েছে",
        message: "ওয়েবসাইট ডিজাইন লেনদেনটি তৈরি হয়েছে। পেমেন্ট জমা দিন।",
        type: "transaction",
        isRead: false,
      },
      {
        userId: seller.id,
        transactionId: t1.id,
        title: "নতুন লেনদেন তৈরি হয়েছে",
        message: "রহিম উদ্দিন একটি নতুন লেনদেন তৈরি করেছেন।",
        type: "transaction",
        isRead: false,
      },
      {
        userId: buyer.id,
        transactionId: t2.id,
        title: "পেমেন্ট জমা দেওয়া হয়েছে",
        message: "গ্রাফিক ডিজাইন লেনদেনের পেমেন্ট জমা দেওয়া হয়েছে, যাচাইয়ের অপেক্ষায় আছে।",
        type: "payment",
        isRead: false,
      },
      {
        userId: seller.id,
        transactionId: t3.id,
        title: "পেমেন্ট অনুমোদিত",
        message: "লোগো ডিজাইন লেনদেনের পেমেন্ট অনুমোদিত হয়েছে।",
        type: "payment",
        isRead: true,
      },
      {
        userId: seller.id,
        transactionId: t4.id,
        title: "কাজ শুরু হয়েছে",
        message: "মোবাইল অ্যাপ ডেভেলপমেন্ট লেনদেনের কাজ শুরু হয়েছে।",
        type: "transaction",
        isRead: false,
      },
      {
        userId: buyer.id,
        transactionId: t5.id,
        title: "লেনদেন সম্পন্ন",
        message: "কনটেন্ট রাইটিং লেনদেন সফলভাবে সম্পন্ন হয়েছে।",
        type: "transaction",
        isRead: true,
      },
      {
        userId: seller.id,
        transactionId: t6.id,
        title: "বিরোধ খোলা হয়েছে",
        message: "ডিজিটাল মার্কেটিং লেনদেনে একটি বিরোধ খোলা হয়েছে।",
        type: "dispute",
        isRead: false,
      },
      {
        userId: admin.id,
        transactionId: t6.id,
        title: "নতুন বিরোধ",
        message: "ডিজিটাল মার্কেটিং লেনদেনে একটি বিরোধ খোলা হয়েছে। পর্যালোচনা করুন।",
        type: "dispute",
        isRead: false,
      },
    ],
  });

  // Create admin logs
  await prisma.adminLog.create({
    data: {
      userId: admin.id,
      action: "payment_approved",
      details: "লোগো ডিজাইন লেনদেনের পেমেন্ট অনুমোদন করা হয়েছে",
    },
  });

  await prisma.adminLog.create({
    data: {
      userId: admin.id,
      action: "payment_approved",
      details: "মোবাইল অ্যাপ ডেভেলপমেন্ট লেনদেনের পেমেন্ট অনুমোদন করা হয়েছে",
    },
  });

  // Create payment account settings (SiteSetting)
  const paymentSettings = [
    { key: "bkash_account", value: "01712345678" },
    { key: "bkash_account_name", value: "বাংলা এসক্রো সার্ভিস" },
    { key: "nagad_account", value: "01812345678" },
    { key: "nagad_account_name", value: "বাংলা এসক্রো সার্ভিস" },
    { key: "rocket_account", value: "01912345678" },
    { key: "rocket_account_name", value: "বাংলা এসক্রো সার্ভিস" },
    { key: "bank_name", value: "ডাচ বাংলা ব্যাংক লিমিটেড" },
    { key: "bank_account", value: "1234567890123" },
    { key: "bank_account_name", value: "বাংলা এসক্রো সার্ভিস লিমিটেড" },
    { key: "bank_branch", value: "ঢাকা মেইন ব্রাঞ্চ" },
    { key: "bank_routing", value: "090123456" },
  ];

  for (const setting of paymentSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log("\n📋 Demo Accounts:");
  console.log("  Admin:  admin@banglaescrow.com / admin123");
  console.log("  Buyer:  buyer@example.com / buyer123");
  console.log("  Seller: seller@example.com / seller123");
  console.log("  User:   fatima@example.com / user123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
