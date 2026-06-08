import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  // Seed subscription plans
  const plans = [
    {
      name: 'Basic',
      slug: 'basic',
      description: 'স্ট্যান্ডার্ড ফিচার সহ বেসিক অ্যাকাউন্ট',
      badgeIcon: 'star',
      badgeColor: '#9CA3AF',
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
      sortOrder: 1,
      priorityListing: false,
      premiumProfile: false,
      featuredProfile: false,
      higherDealLimits: false,
      prioritySupport: false,
      advancedAnalytics: false,
      customProfileBanner: false,
      featuredSellerStatus: false,
      featuredBuyerStatus: false,
      fasterDisputeResolution: false,
      profileVerification: false,
      vipSupport: false,
      maximumVisibility: false,
      exclusiveFeatures: false,
    },
    {
      name: 'Premium',
      slug: 'premium',
      description: 'প্রিমিয়াম ব্যাজ এবং অতিরিক্ত সুবিধা সহ উন্নত অ্যাকাউন্ট',
      badgeIcon: 'diamond',
      badgeColor: '#8B5CF6',
      monthlyPrice: 299,
      yearlyPrice: 2999,
      isActive: true,
      sortOrder: 2,
      priorityListing: true,
      premiumProfile: true,
      featuredProfile: false,
      higherDealLimits: false,
      prioritySupport: false,
      advancedAnalytics: false,
      customProfileBanner: false,
      featuredSellerStatus: false,
      featuredBuyerStatus: false,
      fasterDisputeResolution: false,
      profileVerification: false,
      vipSupport: false,
      maximumVisibility: false,
      exclusiveFeatures: false,
    },
    {
      name: 'Verified Pro',
      slug: 'verified-pro',
      description: 'ভেরিফাইড প্রো ব্যাজ, ফিচার্ড প্রোফাইল এবং উচ্চতর লেনদেন সীমা',
      badgeIcon: 'shield-check',
      badgeColor: '#10B981',
      monthlyPrice: 599,
      yearlyPrice: 5999,
      isActive: true,
      sortOrder: 3,
      priorityListing: true,
      premiumProfile: true,
      featuredProfile: true,
      higherDealLimits: true,
      prioritySupport: true,
      advancedAnalytics: false,
      customProfileBanner: false,
      featuredSellerStatus: false,
      featuredBuyerStatus: false,
      fasterDisputeResolution: false,
      profileVerification: true,
      vipSupport: false,
      maximumVisibility: false,
      exclusiveFeatures: false,
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'বিজনেস ব্যাজ, কোম্পানি প্রোফাইল, বিজনেস ভেরিফিকেশন এবং অ্যাডভান্সড অ্যানালিটিক্স',
      badgeIcon: 'building',
      badgeColor: '#3B82F6',
      monthlyPrice: 999,
      yearlyPrice: 9999,
      isActive: true,
      sortOrder: 4,
      priorityListing: true,
      premiumProfile: true,
      featuredProfile: true,
      higherDealLimits: true,
      prioritySupport: true,
      advancedAnalytics: true,
      customProfileBanner: true,
      featuredSellerStatus: true,
      featuredBuyerStatus: false,
      fasterDisputeResolution: true,
      profileVerification: true,
      vipSupport: false,
      maximumVisibility: false,
      exclusiveFeatures: false,
    },
    {
      name: 'Trusted Elite',
      slug: 'trusted-elite',
      description: 'এলিট ব্যাজ, সর্বোচ্চ দৃশ্যমানতা, VIP সাপোর্ট এবং এক্সক্লুসিভ ফিচার',
      badgeIcon: 'crown',
      badgeColor: '#F59E0B',
      monthlyPrice: 1999,
      yearlyPrice: 19999,
      isActive: true,
      sortOrder: 5,
      priorityListing: true,
      premiumProfile: true,
      featuredProfile: true,
      higherDealLimits: true,
      prioritySupport: true,
      advancedAnalytics: true,
      customProfileBanner: true,
      featuredSellerStatus: true,
      featuredBuyerStatus: true,
      fasterDisputeResolution: true,
      profileVerification: true,
      vipSupport: true,
      maximumVisibility: true,
      exclusiveFeatures: true,
    },
  ];

  for (const plan of plans) {
    await db.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  console.log('[OK] Subscription plans seeded');

  // Seed admin user if not exists
  const existingAdmin = await db.user.findUnique({ where: { email: 'admin@banglaescrow.com' } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await db.user.create({
      data: {
        email: 'admin@banglaescrow.com',
        name: 'Admin',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });
    console.log('[OK] Admin user seeded');
  }

  // Seed buyer user if not exists
  const existingBuyer = await db.user.findUnique({ where: { email: 'buyer@example.com' } });
  if (!existingBuyer) {
    const hashedPassword = await bcrypt.hash('buyer123', 12);
    await db.user.create({
      data: {
        email: 'buyer@example.com',
        name: 'Buyer User',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        buyerRating: 4.5,
        sellerRating: 0,
        totalReviews: 8,
        completedDeals: 12,
        successfulTransactions: 10,
        trustScore: 85,
        disputeRate: 0.05,
      },
    });
    console.log('[OK] Buyer user seeded');
  }

  // Seed seller user if not exists
  const existingSeller = await db.user.findUnique({ where: { email: 'seller@example.com' } });
  if (!existingSeller) {
    const hashedPassword = await bcrypt.hash('seller123', 12);
    await db.user.create({
      data: {
        email: 'seller@example.com',
        name: 'Seller User',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        buyerRating: 0,
        sellerRating: 4.8,
        totalReviews: 15,
        completedDeals: 20,
        successfulTransactions: 18,
        trustScore: 92,
        disputeRate: 0.03,
      },
    });
    console.log('[OK] Seller user seeded');
  }

  console.log('[DONE] All seed data complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
