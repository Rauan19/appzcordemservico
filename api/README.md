# API (ZC NET CONFIG)

## Config

Copie o `.env.example` para `.env` e ajuste se precisar:

```bash
copy .env.example .env
```

## Rodar

1) Subir o banco:

```bash
docker compose up -d
```

2) Instalar e iniciar API:

```bash
npm i
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Usuários padrão (seed)

| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@zcnet.local | admin123 | ADMIN |
| tecnico@zcnet.local | tecnico123 | TECHNICIAN |

## Autenticação

Todas as rotas (exceto `/health` e `POST /auth/login`) exigem header:

```
Authorization: Bearer <token>
```

- `POST /auth/login`  retorna `{ token, user }`
- `GET /auth/me`  usuário logado
- `POST /auth/users`  criar usuário (somente ADMIN)

## Principais rotas

| Módulo | Rotas |
|--------|-------|
| Clientes | `GET/POST /customers`, `GET /customers/:id` |
| Endereços | `GET/POST /customers/:customerId/addresses`, `GET .../addresses/:id` |
| Produtos | `GET/POST /products`, `GET /products/:id` |
| Catálogo de serviços | `GET /service-catalog`, `POST/PATCH` (ADMIN/MANAGER) |
| Usuários | `GET /users/technicians`, `GET /users` (ADMIN/MANAGER) |
| OS | `GET/POST /service-orders`, `GET ?status=&assignedTo=me`, `PATCH /:id/status` |
| OS + estoque | `POST /service-orders/:id/items` (baixa automática), `POST /:id/defects` |
| Estoque | `GET /stock/balance`, `GET /stock/movements`, `POST /stock/movements` |

## Healthcheck

- `GET http://localhost:3333/health`
