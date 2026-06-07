import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ServiceOrderListFilter } from "@/src/services/api-service";
import type { Product, ServiceOrder, StockBalance } from "@/src/types/api";

const LIST_KEY = (filter: ServiceOrderListFilter) => `@zcnet:cache:orders:list:${filter}`;
const ORDER_KEY = (id: string) => `@zcnet:cache:orders:detail:${id}`;
const PRODUCTS_KEY = "@zcnet:cache:products";
const STOCK_KEY = "@zcnet:cache:stock";

type CachedList = {
  syncedAt: string;
  orders: ServiceOrder[];
};

type CachedOrder = {
  syncedAt: string;
  order: ServiceOrder;
};

type CachedProducts = {
  syncedAt: string;
  products: Product[];
};

type CachedStock = {
  syncedAt: string;
  balances: StockBalance[];
};

export function filterOrdersLocally(
  orders: ServiceOrder[],
  filter: ServiceOrderListFilter,
): ServiceOrder[] {
  if (filter === "all") return orders;
  if (filter === "scheduled") return orders.filter((o) => Boolean(o.scheduledAt));
  return orders.filter((o) => o.status === filter);
}

export async function saveOrdersList(filter: ServiceOrderListFilter, orders: ServiceOrder[]) {
  const syncedAt = new Date().toISOString();
  const payload: CachedList = { syncedAt, orders };
  await AsyncStorage.setItem(LIST_KEY(filter), JSON.stringify(payload));
  await Promise.all(orders.map((order) => saveOrderDetail(order, syncedAt)));
}

export async function getOrdersList(
  filter: ServiceOrderListFilter,
): Promise<CachedList | null> {
  const raw = await AsyncStorage.getItem(LIST_KEY(filter));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedList;
  } catch {
    return null;
  }
}

export async function getOrdersListWithFallback(
  filter: ServiceOrderListFilter,
): Promise<CachedList | null> {
  const direct = await getOrdersList(filter);
  if (direct) return direct;

  const all = await getOrdersList("all");
  if (!all) return null;

  const orders = filterOrdersLocally(all.orders, filter);
  return { syncedAt: all.syncedAt, orders };
}

export async function saveOrderDetail(order: ServiceOrder, syncedAt?: string) {
  const payload: CachedOrder = {
    syncedAt: syncedAt ?? new Date().toISOString(),
    order,
  };
  await AsyncStorage.setItem(ORDER_KEY(order.id), JSON.stringify(payload));
}

export async function getOrderDetail(id: string): Promise<CachedOrder | null> {
  const raw = await AsyncStorage.getItem(ORDER_KEY(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedOrder;
  } catch {
    return null;
  }
}

export async function saveProducts(products: Product[]) {
  const payload: CachedProducts = {
    syncedAt: new Date().toISOString(),
    products,
  };
  await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(payload));
}

export async function getProducts(): Promise<CachedProducts | null> {
  const raw = await AsyncStorage.getItem(PRODUCTS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedProducts;
  } catch {
    return null;
  }
}

export async function saveStock(balances: StockBalance[]) {
  const payload: CachedStock = {
    syncedAt: new Date().toISOString(),
    balances,
  };
  await AsyncStorage.setItem(STOCK_KEY, JSON.stringify(payload));
}

export async function getStock(): Promise<CachedStock | null> {
  const raw = await AsyncStorage.getItem(STOCK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedStock;
  } catch {
    return null;
  }
}
