import { prisma } from "../lib/prisma";

export const initCleanupWorker = (io: any) => {
  // Run every 5 seconds
  setInterval(async () => {
    try {
      const expiredReservations = await prisma.reservation.findMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() }
        }
      });

      if (expiredReservations.length === 0) return;

      for (const res of expiredReservations) {
        await prisma.$transaction(async (tx) => {
          await tx.drop.update({
            where: { id: res.dropId },
            data: { availableStock: { increment: 1 } }
          });

          await tx.reservation.delete({ where: { id: res.id } });

          const updated = await tx.drop.findUnique({ where: { id: res.dropId } });
          io.emit('STOCK_UPDATED', { dropId: res.dropId, newStock: updated?.availableStock });
        });
      }
      console.log(`Cleaned up ${expiredReservations.length} reservations.`);
    } catch (err) {
      console.error("Cleanup Error:", err);
    }
  }, 5000);
};