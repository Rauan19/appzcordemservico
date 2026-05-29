import { BadRequestError, ConflictError, NotFoundError } from "../../http/http-errors.ts";
import { StockRepository } from "../stock/stock.repository.ts";
import { ProductRepository } from "./product.repository.ts";

function toDecimalString(n: number) {
  return n.toFixed(3);
}

export class ProductService {
  constructor(
    private readonly repo = new ProductRepository(),
    private readonly stock = new StockRepository(),
  ) {}

  async create(input: {
    name: string;
    series?: string;
    sku?: string;
    unit: string;
    active?: boolean;
  }) {
    if (input.sku) {
      const existing = await this.repo.findBySku(input.sku);
      if (existing) throw new ConflictError("SKU já cadastrado");
    }
    return this.repo.create(input);
  }

  async list() {
    return this.repo.list();
  }

  async suggest(query: string) {
    return this.repo.search(query);
  }

  async getById(id: string) {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundError("Produto não encontrado");
    return product;
  }

  async update(
    id: string,
    input: {
      name?: string;
      series?: string | null;
      sku?: string | null;
      unit?: string;
      active?: boolean;
    },
  ) {
    await this.getById(id);

    if (input.sku) {
      const existing = await this.repo.findBySku(input.sku);
      if (existing && existing.id !== id) {
        throw new ConflictError("SKU já cadastrado");
      }
    }

    return this.repo.update(id, {
      name: input.name,
      series: input.series === null ? null : input.series ?? undefined,
      sku: input.sku === null ? null : input.sku ?? undefined,
      unit: input.unit,
      active: input.active,
    });
  }

  async delete(id: string) {
    await this.getById(id);
    const usage = await this.repo.countUsage(id);

    if (usage > 0) {
      const product = await this.repo.update(id, { active: false });
      return { ok: true as const, deactivated: true as const, product };
    }

    await this.repo.delete(id);
    return { ok: true as const, deleted: true as const };
  }

  async intake(
    input:
      | {
          action: "restock";
          productId: string;
          quantity: number;
          batchNote?: string;
          reason?: string;
        }
      | {
          action: "new";
          name: string;
          series?: string;
          sku?: string;
          unit: string;
          quantity?: number;
          batchNote?: string;
          reason?: string;
        },
    userId?: string,
  ) {
    if (input.action === "restock") {
      const product = await this.getById(input.productId);
      if (!product.active) {
        throw new BadRequestError("Produto inativo. Reative-o antes de repor estoque.");
      }

      await this.stock.createMovement({
        type: "IN",
        productId: input.productId,
        userId,
        quantity: toDecimalString(input.quantity),
        reason: input.reason ?? "Reposição de estoque",
        note: input.batchNote,
      });

      const balance = await this.stock.balanceForProduct(input.productId);
      return { action: "restock" as const, product, balance, quantity: input.quantity };
    }

    const duplicates = await this.repo.findSimilar(input.name, input.series);
    if (duplicates.length > 0) {
      throw new ConflictError(
        "Já existe um produto com este nome e série. Use Repor estoque no produto existente.",
      );
    }

    const product = await this.create({
      name: input.name,
      series: input.series,
      sku: input.sku,
      unit: input.unit,
    });

    let balance = 0;
    if (input.quantity && input.quantity > 0) {
      await this.stock.createMovement({
        type: "IN",
        productId: product.id,
        userId,
        quantity: toDecimalString(input.quantity),
        reason: input.reason ?? "Entrada inicial",
        note: input.batchNote,
      });
      balance = await this.stock.balanceForProduct(product.id);
    }

    return { action: "new" as const, product, balance, quantity: input.quantity ?? 0 };
  }
}
