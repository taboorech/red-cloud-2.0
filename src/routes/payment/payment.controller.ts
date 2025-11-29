import { PaymentService } from "@app/lib/services/payment.service";
import { getPaymentUrlSchema } from "@app/lib/validation/payment.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export default class PaymentController {
  constructor(@inject(PaymentService) private paymentService: PaymentService) {
    this.getPaymentUrl = this.getPaymentUrl.bind(this);
    this.cancelSubscription = this.cancelSubscription.bind(this);
    this.activateTrialPremium = this.activateTrialPremium.bind(this);
    this.webhookHandler = this.webhookHandler.bind(this);
    this.getPlans = this.getPlans.bind(this);
    this.getCurrentSubscription = this.getCurrentSubscription.bind(this);
  }

  public async getPaymentUrl(req: Request, res: Response) {
    const { subscriptionPlanId, priceId } = getPaymentUrlSchema.parse(
      req.query,
    );
    const userId = req.user!.id;

    const paymentUrl = await this.paymentService.getPaymentUrl(
      userId,
      subscriptionPlanId,
      priceId,
    );

    res.json({
      status: "OK",
      data: paymentUrl,
    });
  }

  public async cancelSubscription(req: Request, res: Response) {
    const userId = req.user!.id;

    await this.paymentService.cancelSubscription(userId);

    res.json({
      status: "OK",
      message: "Subscription canceled successfully",
    });
  }

  public async activateTrialPremium(req: Request, res: Response) {
    const userId = req.user!.id;

    await this.paymentService.activateTrialPremium(userId);

    res.json({
      status: "OK",
      message: "Trial premium activated successfully",
    });
  }

  public async getPlans(req: Request, res: Response) {
    const plans = await this.paymentService.getSubscriptionPlans();

    res.json({
      status: "OK",
      data: plans,
    });
  }

  public async getCurrentSubscription(req: Request, res: Response) {
    const userId = req.user!.id;

    const subscription =
      await this.paymentService.getCurrentUserSubscription(userId);

    res.json({
      status: "OK",
      data: subscription,
    });
  }

  public async webhookHandler(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"] as string;
    const payload = req.body;

    await this.paymentService.webhookHandler(payload, signature);

    res.json({ status: "OK" });
  }
}
