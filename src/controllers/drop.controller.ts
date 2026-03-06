import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { attemptReservation } from '../services/reservation.service';

export const createDrop = async (req: Request, res: Response) => {
  const { name, price, stock } = req.body;
  try {
    const drop = await prisma.drop.create({
      data: { name, price, totalStock: stock, availableStock: stock }
    });
    res.status(201).json(drop);
  } catch (error) {
    res.status(500).json({ error: "Failed to create drop" });
  }
};

export const getAllDrops = async (req: Request, res: Response) => {
  const drops = await prisma.drop.findMany({
    include: {
      purchases: {
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } }
      }
    }
  });
  res.json(drops);
};

export const reserveDrop = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const reservation = await attemptReservation(userId, id);

    const updatedDrop = await prisma.drop.findUnique({
      where: { id }
    });

    req.app.get('io').emit('STOCK_UPDATE', {
      dropId: id,
      stock: updatedDrop?.availableStock
    });

    res.json(reservation);

  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};