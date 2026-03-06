import { prisma } from '../lib/prisma';

export const attemptReservation = async (userId: string, dropId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Lock the drop row so others have to wait - race condition
    const [drop]: any[] = await tx.$queryRaw`
      SELECT * FROM "Drop" WHERE id = ${dropId} FOR UPDATE
    `;

    if (!drop || drop.availableStock <= 0) {
      throw new Error("SOLD_OUT");
    }

    await tx.drop.update({
      where: { id: dropId },
      data: { availableStock: { decrement: 1 } }
    });

    const reservation = await tx.reservation.create({
      data: {
        userId,
        dropId,
        expiresAt: new Date(Date.now() + 60000), // 1 Minute
      }
    });

    return reservation;
  });
};