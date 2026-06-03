import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import usersRouter from "./users";
import adminRouter from "./admin";
import couponsRouter from "./coupons";
import salesRouter from "./sales";
import paymentRouter from "./payment";
import inventoryRouter from "./inventory";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/products", productsRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/users", usersRouter);
router.use("/admin", adminRouter);
router.use("/coupons", couponsRouter);
router.use("/sales", salesRouter);
router.use("/payment", paymentRouter);
router.use("/inventory", inventoryRouter);

export default router;
