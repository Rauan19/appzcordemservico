# Como o bot fala com a Evolution API (referência)

Extraído do módulo `whatsapp` do backend Nest da loja.
O `bot-whatsapp/` standalone é obsoleto; o bot real vive nesse módulo.

## Envio (header `apikey: <EVOLUTION_API_KEY>`, sempre `/{instancia}` na URL)

| O quê | Rota | Body |
|-------|------|------|
| Texto | `POST /message/sendText/{inst}` | `{ number, text }` |
| Imagem | `POST /message/sendMedia/{inst}` | `{ number, mediatype:"image", mimetype, media, caption, fileName }` |
| Botões (máx. 3) | `POST /message/sendButtons/{inst}` | `{ number, title, description, footer, buttons:[{type:"reply", displayText, id}] }` |
| Lista | `POST /message/sendList/{inst}` | `{ number, title, description, buttonText, footerText, sections:[{title, rows:[{rowId, title, description?}]}] }` |

Cada envio devolve `key.id`. O bot guarda esse id para reconhecer o próprio eco no webhook.

## Instância

| O quê | Rota |
|-------|------|
| Criar | `POST /instance/create` `{ instanceName, integration:"WHATSAPP-BAILEYS", qrcode:true, webhook:{enabled,url,byEvents:false,events:["MESSAGES_UPSERT"]} }` |
| Reaplicar webhook | `POST /webhook/set/{inst}` `{ webhook:{...} }` (necessário: create em instância existente é ignorado) |
| QR | `GET /instance/connect/{inst}` -> `base64` ou `qrcode.base64` |
| Estado | `GET /instance/connectionState/{inst}` -> `instance.state` (`open`/`connecting`/`close`) |
| Desconectar | `DELETE /instance/logout/{inst}` |
| Excluir | `DELETE /instance/delete/{inst}` |

## Webhook recebido (`MESSAGES_UPSERT`)

- `instance` = nome da instância (é assim que se sabe de qual aparelho veio).
- `data.key.remoteJid`, `data.key.fromMe`, `data.key.id`, `data.message`.
- Texto vem de: `conversation`, `extendedTextMessage.text`, `imageMessage.caption`.
- Resposta de botão: `buttonsResponseMessage.selectedButtonId` (preferir o id ao texto).
- Resposta de lista: `listResponseMessage.singleSelectReply.selectedRowId` (preferir o rowId).
- Ignorar grupos (`@g.us`) e `fromMe`.
- Ao responder, se o JID for `@lid`, mandar o JID completo em `number`; só reduzir a dígitos para `@s.whatsapp.net`.

## Sessão / estado da conversa

Redis (fallback em memória): passo da conversa por `instancia + jid` (TTL 24h), dedupe por messageId (1h),
e pausa de 6h quando um humano assume.

## Webhook em dev

Evolution no Docker chamando o host: `http://host.docker.internal:<porta>/<rota>`.
