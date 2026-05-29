# ZC NET CONFIG

Monorepo com:

- `api/`: backend (Fastify + Prisma + PostgreSQL)
- `app/`: app mobile (Expo Go / tablet do técnico)
- `web/`: painel web admin (React + Vite)

## Banco de dados (Docker)

O `docker-compose.yml` do banco fica dentro de `api/`.
O PostgreSQL roda em container e expõe a porta `5439` no host.

```bash
cd api
docker compose up -d
```

Parar/remover containers:

```bash
cd api
docker compose down
```

Ver logs do banco:

```bash
cd api
docker compose logs -f db
```

Conexão no host (ex.: DBeaver/pgAdmin):

- host: `localhost`
- porta: `5439`
- usuário: `zc`
- senha: `zcpass`
- database: `zcnetconfig`

## App (tablet do técnico)

```bash
cd app
copy .env.example .env
# Edite EXPO_PUBLIC_API_URL com o IP do PC (ex.: http://192.168.0.10:3333)
npm start
```

Abra no **Expo Go** do tablet. Login de teste: `tecnico@zcnet.local` / `tecnico123`

Detalhes: [app/README.md](app/README.md)

## Painel web (admin / gerente)

```bash
cd web
npm install
npm run dev
```

Abra **http://localhost:5173**  login: `admin@zcnet.local` / `admin123`

Detalhes: [web/README.md](web/README.md)
