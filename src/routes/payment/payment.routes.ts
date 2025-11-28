import express, { Router } from "express";
import { Container } from "inversify";
import PaymentController from "./payment.controller";

const createPublicPaymentRoutes = (ioc: Container) => {
  const router = Router();

  const ctrl = ioc.get(PaymentController);
  router.get("/plans", ctrl.getPlans);

  return router;
};

const createProtectedPaymentRoutes = (ioc: Container) => {
  const router = Router();

  const ctrl = ioc.get(PaymentController);

  router.get("/subscription", ctrl.getPaymentUrl);
  router.get("/current-subscription", ctrl.getCurrentSubscription);
  router.post("/subscription", ctrl.cancelSubscription);
  router.post("/trial", ctrl.activateTrialPremium);

  return router;
};

export { createPublicPaymentRoutes, createProtectedPaymentRoutes };
