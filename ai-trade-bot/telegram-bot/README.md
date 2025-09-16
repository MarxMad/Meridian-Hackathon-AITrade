# 🤖 Bot de Telegram - AI Trading Bot

Bot de Telegram para trading automático en Stellar usando Soroswap.

## 🚀 Características

- **Swaps Automáticos**: Intercambia XLM ↔ USDC con comandos de texto
- **Cotizaciones Reales**: Usa la API de Soroswap para precios actuales
- **Interfaz Intuitiva**: Comandos simples y claros
- **Confirmación de Transacciones**: Sistema de confirmación antes de ejecutar
- **Precios en Tiempo Real**: Consulta precios actuales de XLM

## 📱 Comandos Disponibles

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/start` | Iniciar el bot | `/start` |
| `/help` | Mostrar ayuda | `/help` |
| `/swap <cantidad> XLM` | Hacer swap de XLM a USDC | `/swap 5 XLM` |
| `/price` | Ver precio actual de XLM | `/price` |
| `/balance` | Ver balance (simulado) | `/balance` |
| `/status` | Ver estado de transacción | `/status` |

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp config.example.env .env
```

3. **Editar `.env` con tu token de bot:**
```env
TELEGRAM_BOT_TOKEN=TU_BOT_TOKEN_AQUI
API_BASE_URL=http://localhost:3000
```

4. **Iniciar el bot:**
```bash
npm start
```

## 🔧 Configuración del Bot

### 1. Crear Bot en Telegram

1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Usa el comando `/newbot`
3. Sigue las instrucciones para crear tu bot
4. Copia el token y pégalo en `.env`

### 2. Configurar Webhook (Opcional)

Para producción, puedes usar webhooks en lugar de polling:

```javascript
// En index.js, reemplazar polling con webhook
bot.setWebHook('https://tu-dominio.com/webhook');
```

## 📊 Flujo de Uso

1. **Iniciar conversación**: `/start`
2. **Ver precio**: `/price`
3. **Hacer swap**: `/swap 5 XLM`
4. **Confirmar**: Responde "SÍ" cuando se te pida
5. **Ver resultado**: El bot te mostrará el hash de la transacción

## 🔒 Seguridad

- **Testnet**: El bot funciona en Stellar Testnet para pruebas
- **Confirmación**: Requiere confirmación antes de ejecutar swaps
- **Validación**: Valida cantidades y formatos antes de procesar

## 🚀 Ejemplo de Conversación

```
Usuario: /start
Bot: 🤖 AI Trading Bot - Stellar Swaps
     ¡Hola! Soy tu asistente de trading automático...

Usuario: /price
Bot: 📊 Obteniendo precio de XLM...
     💰 Precio de XLM
     • Precio actual: $0.1234 USD
     • Red: Stellar Testnet

Usuario: /swap 5 XLM
Bot: 🔄 Iniciando Swap
     • Cantidad: 5 XLM
     • Destino: USDC
     • Estado: Obteniendo cotización...
     
     📊 Cotización Obtenida
     • Entrada: 5 XLM
     • Salida: ~4.85 USDC
     • Impacto de precio: 0.00%
     
     ¿Confirmas el swap? Responde "SÍ" para continuar.

Usuario: SÍ
Bot: 🚀 Ejecutando swap...
     
     ✅ Swap Exitoso!
     • Cantidad: 5 XLM → USDC
     • Hash: DEMO_HASH_123
     • Ledger: 123456
     
     ¡Tu swap se ha completado exitosamente! 🎉
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
telegram-bot/
├── index.js          # Código principal del bot
├── package.json      # Dependencias
├── config.example.env # Configuración de ejemplo
└── README.md         # Documentación
```

### Agregar Nuevos Comandos

1. Agregar comando a `commands` object
2. Crear handler con `bot.onText()`
3. Implementar lógica del comando
4. Actualizar documentación

### Integración con APIs

El bot se integra con:
- **Soroswap API**: Para cotizaciones y swaps
- **Stellar Horizon**: Para datos de la blockchain
- **Frontend API**: Para funcionalidades adicionales

## 📈 Próximas Características

- [ ] Soporte para múltiples assets
- [ ] Historial de transacciones
- [ ] Alertas de precio
- [ ] Trading automático con IA
- [ ] Integración con wallets reales
- [ ] Soporte para mainnet

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.
