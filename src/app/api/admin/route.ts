import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helper";

// GET /api/admin - Return dashboard statistics (admin only)
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "অ্যাডমিন অনুমতি আবশ্যক" },
        { status: 403 }
      );
    }

    // Get total users
    const totalUsers = await db.user.count();

    // Get transactions by status
    const [
      totalTransactions,
      pendingPaymentTransactions,
      pendingVerificationTransactions,
      paidTransactions,
      workInProgressTransactions,
      deliveredTransactions,
      completedTransactions,
      disputedTransactions,
      cancelledTransactions,
    ] = await Promise.all([
      db.transaction.count(),
      db.transaction.count({ where: { status: "pending_payment" } }),
      db.transaction.count({ where: { status: "pending_verification" } }),
      db.transaction.count({ where: { status: "paid" } }),
      db.transaction.count({ where: { status: "work_in_progress" } }),
      db.transaction.count({ where: { status: "delivered" } }),
      db.transaction.count({ where: { status: "completed" } }),
      db.transaction.count({ where: { status: "disputed" } }),
      db.transaction.count({ where: { status: "cancelled" } }),
    ]);

    // Active = all non-completed, non-cancelled transactions
    const activeTransactions = totalTransactions - completedTransactions - cancelledTransactions;

    // Pending = pending_payment + pending_verification
    const pendingTransactions = pendingPaymentTransactions + pendingVerificationTransactions;

    // Get payment stats
    const [pendingPayments, approvedPayments] = await Promise.all([
      db.payment.count({ where: { status: "pending" } }),
      db.payment.count({ where: { status: "approved" } }),
    ]);

    // Get dispute stats
    const openDisputes = await db.dispute.count({ where: { status: "open" } });

    // Get total transaction volume (completed)
    const completedVolume = await db.transaction.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      totalUsers,
      totalTransactions,
      activeTransactions,
      pendingTransactions,
      completedTransactions,
      disputedTransactions,
      cancelledTransactions,
      pendingPayments,
      approvedPayments,
      openDisputes,
      completedVolume: completedVolume._sum.amount || 0,
      transactionsByStatus: {
        pending_payment: pendingPaymentTransactions,
        pending_verification: pendingVerificationTransactions,
        paid: paidTransactions,
        work_in_progress: workInProgressTransactions,
        delivered: deliveredTransactions,
        completed: completedTransactions,
        disputed: disputedTransactions,
        cancelled: cancelledTransactions,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    return NextResponse.json(
      { error: "পরিসংখ্যান লোড করতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
