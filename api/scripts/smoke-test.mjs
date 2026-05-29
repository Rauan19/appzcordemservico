const base = "http://127.0.0.1:3333";

async function req(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

const cpf = String(Date.now()).slice(-11);

const health = await req("GET", "/health");
const login = await req("POST", "/auth/login", {
  email: "admin@zcnet.local",
  password: "admin123",
});
const { token } = login;

const customer = await req(
  "POST",
  "/customers",
  { fullName: "Maria Silva", cpf, phone: "11988887777" },
  token,
);
const address = await req(
  "POST",
  `/customers/${customer.id}/addresses`,
  { label: "Casa", street: "Rua A", number: "100", city: "São Paulo", state: "SP" },
  token,
);
const product = await req(
  "POST",
  "/products",
  { name: "ONU Test", sku: `ONU-${cpf}`, unit: "un" },
  token,
);
await req("POST", "/stock/movements", { type: "IN", productId: product.id, quantity: 20, reason: "Compra" }, token);

const techLogin = await req("POST", "/auth/login", {
  email: "tecnico@zcnet.local",
  password: "tecnico123",
});
const techs = await req("GET", "/users/technicians", null, token);
const so = await req(
  "POST",
  "/service-orders",
  {
    customerId: customer.id,
    addressId: address.id,
    assignedToId: techs[0]?.id,
    title: "Instalação fibra",
    priority: "NORMAL",
  },
  token,
);

const item = await req(
  "POST",
  `/service-orders/${so.id}/items`,
  { productId: product.id, quantity: 3, reason: "Uso na OS" },
  techLogin.token,
);
const bal = await req("GET", `/stock/balance?productId=${product.id}`, null, token);

console.log(
  JSON.stringify(
    {
      health,
      admin: login.user.email,
      customer: customer.id,
      address: address.id,
      product: product.id,
      serviceOrder: so.code,
      item: item.item?.id,
      balance: bal[0]?.balance,
      ok: true,
    },
    null,
    2,
  ),
);
