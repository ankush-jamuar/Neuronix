import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';
import express from 'express';

const router = Router();
const prisma = new PrismaClient();

router.post('/clerk', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    res.status(500).json({ error: 'Missing webhook secret' });
    return;
  }

  // Get headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({ error: 'Missing svix headers' });
    return;
  }

  // Get body
  const payload = req.body;
  
  // Initialize Svix
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err: any) {
    console.error('Error verifying webhook:', err.message);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  const eventType = evt.type;
  
  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const data = evt.data;
      
      const clerkId = data.id;
      const email = data.email_addresses?.[0]?.email_address || '';
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const name = `${firstName} ${lastName}`.trim();
      const imageUrl = data.image_url;

      console.log('--- Webhook Extracted Data ---', { clerkId, email, name, imageUrl });

      const result = await prisma.user.upsert({
        where: { clerkId },
        update: {
          email,
          name,
          imageUrl,
          isDeleted: false,
        },
        create: {
          clerkId,
          email,
          name,
          imageUrl,
          isDeleted: false,
        }
      });

      console.log('--- Prisma Upsert Result ---', result);
    } else if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      // Soft delete using isDeleted
      await prisma.user.update({
        where: { clerkId: id },
        data: { isDeleted: true }
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
