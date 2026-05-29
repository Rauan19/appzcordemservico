import { NotFoundError } from "../../http/http-errors.ts";
import { ProductRepository } from "../products/product.repository.ts";
import { ServiceOrderRepository } from "../service-orders/service-order.repository.ts";
import { StockRepository } from "./stock.repository.ts";

function toDecimalString(n: number) {
  return n.toFixed(3);
}

export class StockService {
  constructor(
    private readonly repo = new StockRepository(),
    private readonly products = new ProductRepository(),
    private readonly serviceOrders = new ServiceOrderRepository(),
  ) {}

  async createMovement(input: {
    type: "IN" | "OUT_SERVICE_ORDER" | "ADJUSTMENT" | "RETURN" | "DEFECT";
    productId: string;
    serviceOrderId?: string;
    userId?: string;
    quantity: number;
    reason?: string;
    note?: string;
  }) {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError("Produto não encontrado");

    if (input.serviceOrderId) {
      const so = await this.serviceOrders.findById(input.serviceOrderId);
      if (!so) throw new NotFoundError("OS não encontrada");
    }

    return this.repo.createMovement({
      ...input,
      quantity: toDecimalString(input.quantity),
    });
  }

  async balance(productId?: string) {
    return this.repo.balanceByProduct(productId);
  }

  async listMovements(filters?: { productId?: string; serviceOrderId?: string }) {
    return this.repo.listMovements(filters);
  }
}

