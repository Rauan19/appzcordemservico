# Push notifications (Firebase)

## Dois arquivos, duas funções

| Onde | Arquivo | Para quê |
|------|---------|----------|
| **App (Expo)** | `google-services.json` | Tablet **recebe** push (você sobe no EAS / credenciais Expo) |
| **API (Node)** | `firebase-service-account.json` | Servidor **envia** push quando admin cria OS |

O JSON que você joga nas **credenciais do Expo** é o `google-services.json`  isso configura só o **app**.

A **API** roda no seu PC/servidor, fora do Expo. Para ela mandar notificação, precisa da **conta de serviço** (Admin SDK), que é **outro JSON** do Firebase.

---

## 1. App  Expo / tablet

1. Firebase Console → app Android `com.zcnet.config`
2. Baixe **`google-services.json`**
3. Coloque em `app/google-services.json` **ou** envie nas credenciais do EAS Build (como você já faz)
4. Gere build nativo (`expo run:android` ou EAS)  push não funciona no Expo Go em produção

## 2. API  enviar push

1. Firebase Console → **Configurações do projeto** → **Contas de serviço**
2. **Gerar nova chave privada** → baixa um JSON (ex: `zcnet-firebase-adminsdk-xxxxx.json`)
3. Salve como `api/firebase-service-account.json` (não commitar)
4. No `api/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

5. Reinicie a API: `npm run dev`

Pronto  **uma linha no `.env`**, sem copiar project id, email e private key separados.

---

## Teste

1. Técnico logado no tablet (build nativo), permissão de notificação aceita
2. Admin cria OS atribuindo esse técnico
3. Push com som/vibração no tablet; toque abre a OS

Canal Android: `os_alerts` (prioridade máxima, som padrão).
