import { Router } from 'express';
import { prisma } from '../db/client.js';
import bcryptjs from 'bcryptjs';

export const settingsRouter = Router();

// Get user settings
settingsRouter.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        settings: true,
        tier: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Failed to get settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update user settings
settingsRouter.patch('/', async (req, res) => {
  try {
    const { name, timezone, settings } = req.body as {
      name?: string;
      timezone?: string;
      settings?: Record<string, unknown>;
    };

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (settings !== undefined) {
      // Merge with existing settings
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { settings: true },
      });
      const existing = (user?.settings as Record<string, unknown>) || {};
      updateData.settings = { ...existing, ...settings };
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        settings: true,
        tier: true,
        createdAt: true,
      },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Change password
settingsRouter.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one lowercase letter' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcryptjs.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcryptjs.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash },
    });

    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to change password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});
