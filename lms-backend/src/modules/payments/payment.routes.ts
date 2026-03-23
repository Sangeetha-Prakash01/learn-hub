import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import prisma from '../../config/db';
import { authMiddleware } from '../../middleware/authMiddleware';
import { env } from '../../config/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const createCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    const userId = req.user!.id;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ success: false, message: 'Course not found' });

    // Already enrolled?
    const existing = await prisma.enrollment.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
    });
    if (existing) return res.status(400).json({ success: false, message: 'Already enrolled' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: subject.title,
              images: subject.thumbnail ? [subject.thumbnail] : [],
            },
            unit_amount: Math.round(Number(subject.price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/subjects/${subjectId}`,
      metadata: { userId: String(userId), subjectId: String(subjectId) },
    });

    res.json({ success: true, checkoutUrl: session.url });
  } catch (err) {
    next(err);
  }
};

const webhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.userId || '0');
    const subjectId = parseInt(session.metadata?.subjectId || '0');

    if (userId && subjectId) {
      await prisma.enrollment.upsert({
        where: { userId_subjectId: { userId, subjectId } },
        update: {},
        create: { userId, subjectId },
      });

      await prisma.payment.create({
        data: {
          userId,
          subjectId,
          stripePaymentId: session.id,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || 'usd',
          status: 'COMPLETED',
        },
      });
    }
  }

  res.json({ received: true });
};

const enrollFree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    const userId = req.user!.id;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ success: false, message: 'Course not found' });
    if (Number(subject.price) > 0) return res.status(400).json({ success: false, message: 'Use checkout for paid courses' });

    await prisma.enrollment.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      update: {},
      create: { userId, subjectId },
    });

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) { next(err); }
};

const router = Router();
router.post('/checkout/:subjectId', authMiddleware, createCheckout);
router.post('/enroll-free/:subjectId', authMiddleware, enrollFree);
// Webhook uses raw body - registered in app.ts
router.post('/webhook', webhook);

export default router;
