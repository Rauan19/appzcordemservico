import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { authenticate } from "./auth.ts";
import { addressRoutes } from "../modules/addresses/address.routes.ts";
import { authRoutes } from "../modules/auth/auth.routes.ts";
import { customerRoutes } from "../modules/customers/customer.routes.ts";
import { productRoutes } from "../modules/products/product.routes.ts";
import { serviceCatalogRoutes } from "../modules/service-catalog/service-catalog.routes.ts";
import { serviceOrderRoutes } from "../modules/service-orders/service-order.routes.ts";
import { stockRoutes } from "../modules/stock/stock.routes.ts";
import { userRoutes } from "../modules/users/user.routes.ts";
import { evaluationRoutes } from "../modules/evaluations/evaluation.routes.ts";
import { customerRatingRoutes } from "../modules/customer-ratings/customer-rating.routes.ts";
import { pushRoutes } from "../modules/push/push.routes.ts";
import {
  contractRoutes,
  contractTemplateRoutes,
  publicContractRoutes,
} from "../modules/contracts/contract.routes.ts";
import { env } from "../env.ts";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(multipart, {
    limits: { fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024 },
  });

  app.register(authRoutes, { prefix: "/auth" });

  app.register(publicContractRoutes, { prefix: "/public/contracts" });

  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook("onRequest", authenticate);

    protectedRoutes.register(customerRoutes, { prefix: "/customers" });
    protectedRoutes.register(addressRoutes, {
      prefix: "/customers/:customerId/addresses",
    });
    protectedRoutes.register(productRoutes, { prefix: "/products" });
    protectedRoutes.register(serviceCatalogRoutes, { prefix: "/service-catalog" });
    protectedRoutes.register(serviceOrderRoutes, { prefix: "/service-orders" });
    protectedRoutes.register(stockRoutes, { prefix: "/stock" });
    protectedRoutes.register(userRoutes, { prefix: "/users" });
    protectedRoutes.register(evaluationRoutes, { prefix: "/evaluations" });
    protectedRoutes.register(customerRatingRoutes, { prefix: "/customer-ratings" });
    protectedRoutes.register(pushRoutes, { prefix: "/push" });
    protectedRoutes.register(contractTemplateRoutes, { prefix: "/contract-templates" });
    protectedRoutes.register(contractRoutes, { prefix: "/contracts" });
  });
}

