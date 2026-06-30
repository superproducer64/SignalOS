import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import onboardingRouter from "./onboarding";
import userRouter from "./user";
import collectRouter from "./collect";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(onboardingRouter);
router.use(userRouter);
router.use(collectRouter);

export default router;
