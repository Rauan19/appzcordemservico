# App ZC NET CONFIG (tablet do técnico)

App **Expo Go** para o técnico do provedor: ver OS atribuídas, iniciar/finalizar serviço, dar baixa no estoque e registrar defeito.

## Pré-requisitos

1. API rodando (`../api`  porta **3333**)
2. [Expo Go](https://expo.dev/go) instalado no tablet (Android/iOS)
3. Tablet e PC na **mesma rede Wi‑Fi**

## Configurar URL da API

No tablet, `localhost` não funciona. Use o IP do seu PC:

```bash
copy .env.example .env
```

Edite `app/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.XX:3333
```

Descubra o IP no Windows: `ipconfig` → IPv4.

| Ambiente | URL típica |
|----------|------------|
| Emulador Android | `http://10.0.2.2:3333` |
| Simulador iOS / web | `http://127.0.0.1:3333` |
| Tablet físico (Expo Go) | `http://SEU_IP_LAN:3333` |

## Rodar

```bash
cd app
npm install
npm start
```

Escaneie o QR Code com o **Expo Go** no tablet.

## Login de teste (seed da API)

| E-mail | Senha |
|--------|-------|
| tecnico@zcnet.local | tecnico123 |

## Telas

- **Login**  autenticação JWT
- **Minhas OS**  lista filtrada (`assignedTo=me`)
- **Detalhe da OS**  iniciar, finalizar, baixa de material, defeito
- **Estoque**  saldo por produto
- **Avaliações**  nota 0–10 do cliente
- **Perfil**  dados do técnico e logout

## Push (Firebase)

Quando o admin cria uma OS atribuída ao técnico, o tablet recebe **notificação com som e vibração**.

- **Expo / EAS:** `google-services.json` nas credenciais (app **recebe** push)
- **API:** `firebase-service-account.json` + uma linha no `.env` (servidor **envia** push)

Detalhes: [docs/PUSH-FIREBASE.md](../docs/PUSH-FIREBASE.md)
