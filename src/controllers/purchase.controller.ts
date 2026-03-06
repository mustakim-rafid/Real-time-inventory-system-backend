import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const completePurchase = async (req: any, res: Response) => {
  const { reservationId } = req.body;
  const userId = req.user.userId;

  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation || reservation.userId !== userId || reservation.status !== 'PENDING') {
        throw new Error("Invalid or expired reservation");
      }

      if (new Date() > reservation.expiresAt) {
        throw new Error("Reservation expired");
      }

      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'BOUGHT' }
      });

      return await tx.purchase.create({
        data: { userId, dropId: reservation.dropId },
        include: { user: { select: { username: true } } }
      });
    });

    req.app.get('io').emit('NEW_PURCHASE', {
      dropId: purchase.dropId,
      username: purchase.user.username
    });

    res.status(200).json({ message: "Purchase successful", purchase });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};