import prisma from '../Config/db.js';

let cleanerInterval = null;

/**
 * Periodically releases abandoned locked seats (locked for > 10 minutes without payment confirmation)
 */
export async function cleanupExpiredSeatLocks() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // 1. Release expired LOCKED seats back to AVAILABLE
    const releasedSeats = await prisma.seats.updateMany({
      where: {
        status: 'LOCKED',
        updated_at: { lt: tenMinutesAgo },
      },
      data: {
        status: 'AVAILABLE',
        updated_at: new Date(),
      },
    });

    if (releasedSeats.count > 0) {
      console.log(`🧹 [SeatCleaner] Released ${releasedSeats.count} expired seat lock(s) back to AVAILABLE.`);
    }

    // 2. Mark abandoned PENDING bookings (> 15 minutes) as EXPIRED
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const expiredBookings = await prisma.bookings.updateMany({
      where: {
        status: 'PENDING',
        updated_at: { lt: fifteenMinutesAgo },
      },
      data: {
        status: 'CANCELLED',
        updated_at: new Date(),
      },
    });

    if (expiredBookings.count > 0) {
      console.log(`🧹 [SeatCleaner] Marked ${expiredBookings.count} abandoned pending booking(s) as CANCELLED.`);
    }
  } catch (err) {
    console.error('⚠️ [SeatCleaner] Error during seat lock cleanup:', err.message);
  }
}

/**
 * Starts the periodic seat lock cleaner interval (runs every 2 minutes)
 */
export function startSeatCleaner(intervalMs = 2 * 60 * 1000) {
  if (cleanerInterval) return;

  // Run initial cleanup on startup
  cleanupExpiredSeatLocks();

  cleanerInterval = setInterval(cleanupExpiredSeatLocks, intervalMs);
  if (cleanerInterval.unref) {
    cleanerInterval.unref(); // Do not block process exit
  }
  console.log('⏱️  [SeatCleaner] Periodic seat cleanup service started (interval: 2m).');
}

/**
 * Stops the seat cleaner interval (during graceful shutdown)
 */
export function stopSeatCleaner() {
  if (cleanerInterval) {
    clearInterval(cleanerInterval);
    cleanerInterval = null;
    console.log('🛑 [SeatCleaner] Periodic seat cleaner stopped.');
  }
}

export default {
  cleanupExpiredSeatLocks,
  startSeatCleaner,
  stopSeatCleaner,
};
