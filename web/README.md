# Painel Web Admin  ZCnet Config

Interface web para **Administrador**, **Gerente** e **Estoque** gerenciarem clientes, produtos, OS e usuários.

## Pré-requisitos

1. API rodando na porta **3333** (`cd ../api && npm run dev`)
2. Banco seedado (`npm run db:seed` na pasta `api`)

## Rodar

```bash
cd web
npm install
npm run dev
```

Abra no navegador: **http://localhost:5173**

O Vite faz proxy de `/api` → `http://127.0.0.1:3333` automaticamente.

## Login

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin@zcnet.local` | `admin123` |
| Técnico | `tecnico@zcnet.local` | `tecnico123` |

> Técnicos **não** acessam este painel  usam o app mobile (Expo Go).

## Telas

- **Ordens de serviço**  listar, criar, atribuir técnico, mudar status
- **Clientes**  cadastrar e listar
- **Produtos**  cadastrar materiais
- **Estoque**  saldo e entrada manual
- **Usuários**  criar usuários (somente ADMIN)

## Build produção

```bash
npm run build
npm run preview
```

Para produção, configure `VITE_API_URL` apontando para a API pública.
