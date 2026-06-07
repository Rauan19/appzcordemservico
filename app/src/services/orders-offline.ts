import {
  getOrderDetail,
  getOrdersListWithFallback,
  getProducts,
  getStock,
  saveOrderDetail,
  saveOrdersList,
  saveProducts,
  saveStock,
} from "@/src/lib/orders-cache";
import { isDeviceOnline, isFetchFailure } from "@/src/lib/network";
import { api, type ServiceOrderListFilter } from "@/src/services/api-service";
import type { Product, ServiceOrder } from "@/src/types/api";

export type OfflineLoadMeta = {
  fromCache: boolean;
  syncedAt?: string;
};

export type OrdersListLoadResult = OfflineLoadMeta & {
  orders: ServiceOrder[];
};

export type OrderDetailLoadResult = OfflineLoadMeta & {
  order: ServiceOrder;
  products: Product[];
  stockByProduct: Record<string, number>;
};

async function loadOrdersFromCache(filter: ServiceOrderListFilter): Promise<OrdersListLoadResult> {
  const cached = await getOrdersListWithFallback(filter);
  if (!cached || cached.orders.length === 0) {
    throw new Error("Nenhuma OS salva no aparelho. Abra o app com internet pelo menos uma vez.");
  }
  return {
    orders: cached.orders,
    fromCache: true,
    syncedAt: cached.syncedAt,
  };
}

export async function loadOrdersList(filter: ServiceOrderListFilter): Promise<OrdersListLoadResult> {
  const online = await isDeviceOnline();

  if (!online) {
    return loadOrdersFromCache(filter);
  }

  try {
    const orders = await api.listOrders(filter);
    await saveOrdersList(filter, orders);
    return {
      orders,
      fromCache: false,
      syncedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (isFetchFailure(err)) {
      return loadOrdersFromCache(filter);
    }
    throw err;
  }
}

async function loadOrderFromCache(id: string): Promise<OrderDetailLoadResult> {
  const cachedOrder = await getOrderDetail(id);
  if (!cachedOrder) {
    throw new Error(
      "Esta OS não está salva no aparelho. Abra-a com internet antes de ir para o local.",
    );
  }

  const cachedProducts = await getProducts();
  const cachedStock = await getStock();
  const stockByProduct: Record<string, number> = {};
  for (const b of cachedStock?.balances ?? []) {
    stockByProduct[b.productId] = b.balance;
  }

  return {
    order: cachedOrder.order,
    products: (cachedProducts?.products ?? []).filter((p) => p.active),
    stockByProduct,
    fromCache: true,
    syncedAt: cachedOrder.syncedAt,
  };
}

export async function loadOrderDetail(id: string): Promise<OrderDetailLoadResult> {
  const online = await isDeviceOnline();

  if (!online) {
    return loadOrderFromCache(id);
  }

  try {
    const [order, products, balances] = await Promise.all([
      api.getOrder(id),
      api.listProducts(),
      api.stockBalance(),
    ]);

    await saveOrderDetail(order);
    await saveProducts(products);
    await saveStock(balances);

    const stockByProduct: Record<string, number> = {};
    for (const b of balances) stockByProduct[b.productId] = b.balance;

    return {
      order,
      products: products.filter((p) => p.active),
      stockByProduct,
      fromCache: false,
      syncedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (isFetchFailure(err)) {
      return loadOrderFromCache(id);
    }
    throw err;
  }
}
