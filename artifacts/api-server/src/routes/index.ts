import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import onboardingRouter from "./onboarding";
import userRouter from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(onboardingRouter);
router.use(userRouter);

export default router;
