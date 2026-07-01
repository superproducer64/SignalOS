import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import onboardingRouter from "./onboarding";
import userRouter from "./user";
import collectRouter from "./collect";
import signalsRouter from "./signals";
import captureRouter from "./capture";
import capturesRouter from "./captures";
import signalActionsRouter from "./signal-actions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(onboardingRouter);
router.use(userRouter);
router.use(collectRouter);
router.use(signalsRouter);
router.use(captureRouter);
router.use(capturesRouter);
router.use(signalActionsRouter);

export default router;
