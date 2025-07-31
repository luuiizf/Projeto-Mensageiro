# Documentação Kong API Gateway - Mensageiro MOM

## Visão Geral

O Kong API Gateway é utilizado como intermediário entre o frontend Angular e o backend Django, fornecendo funcionalidades de roteamento, rate limiting, CORS e monitoramento.

## Arquitetura com Kong

```
Frontend (Angular) → Kong Gateway → Backend (Django) → RabbitMQ
```

### Componentes
- **Kong Gateway**: Porta 8000 (proxy) / 8001 (admin)
- **Django Backend**: Porta 8000 (serviço interno)
- **RabbitMQ**: Porta 5672 (AMQP) / 15672 (Management)

## Configuração do Kong

### Instalação
```bash
# Windows (Chocolatey)
choco install kong

# Ou baixe de: https://konghq.com/install/
```

### Configuração Inicial
```bash
# Iniciar Kong
kong start

# Verificar status
curl http://localhost:8001/status
```

### Serviços Configurados

#### 1. Chat API Service
```yaml
name: chat-api
url: http://localhost:8000
routes:
  - name: chat-api-route
    paths: ["/api"]
    strip_path: false
plugins:
  - name: cors
  - name: rate-limiting
```

#### 2. RabbitMQ Management Service
```yaml
name: rabbitmq-management
url: http://localhost:15672
routes:
  - name: rabbitmq-route
    paths: ["/rabbitmq"]
    strip_path: true
plugins:
  - name: cors
```

## Endpoints Disponíveis

### Via Kong Gateway (http://localhost:8000)
- `GET /api/rooms/` - Listar salas
- `POST /api/rooms/` - Criar sala
- `GET /api/messages/` - Listar mensagens
- `POST /api/send-message/` - Enviar mensagem
- `GET /api/kong/status/` - Status do Kong
- `GET /rabbitmq/` - RabbitMQ Management

### Kong Admin API (http://localhost:8001)
- `GET /services` - Listar serviços
- `GET /routes` - Listar rotas
- `GET /plugins` - Listar plugins

## Plugins Configurados

### CORS Plugin
```json
{
  "name": "cors",
  "config": {
    "origins": ["*"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "headers": ["Content-Type", "Authorization"],
    "exposed_headers": ["X-Total-Count"],
    "credentials": true,
    "max_age": 3600
  }
}
```

### Rate Limiting Plugin
```json
{
  "name": "rate-limiting",
  "config": {
    "minute": 100,
    "hour": 1000,
    "policy": "local"
  }
}
```

### Request Transformer Plugin
```json
{
  "name": "request-transformer",
  "config": {
    "add": {
      "headers": [
        "X-Gateway: Kong",
        "X-Service: Chat-API"
      ]
    }
  }
}
```

## Monitoramento

### Kong Dashboard
- **URL**: http://localhost:8001
- **Funcionalidades**:
  - Visualizar serviços e rotas
  - Monitorar plugins
  - Verificar logs

### Logs do Kong
```bash
# Ver logs do Kong
tail -f /usr/local/kong/logs/error.log
tail -f /usr/local/kong/logs/access.log
```

### Métricas
- **Throughput**: Requisições por segundo
- **Latência**: Tempo de resposta
- **Rate Limiting**: Requisições bloqueadas
- **CORS**: Requisições OPTIONS

## Testes

### Teste de Conectividade
```bash
# Testar Kong Admin
curl http://localhost:8001/status

# Testar API via Kong
curl http://localhost:8000/api/kong/status/

# Testar RabbitMQ via Kong
curl http://localhost:8000/rabbitmq/
```

### Teste de Rate Limiting
```bash
# Fazer múltiplas requisições
for i in {1..110}; do
  curl http://localhost:8000/api/rooms/
done
```

### Teste de CORS
```bash
# Testar preflight request
curl -X OPTIONS http://localhost:8000/api/rooms/ \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: POST"
```

## Troubleshooting

### Kong não inicia
```bash
# Verificar se a porta está livre
netstat -an | findstr 8000
netstat -an | findstr 8001

# Verificar logs
tail -f /usr/local/kong/logs/error.log
```

### Serviços não configurados
```bash
# Reconfigurar serviços
cd kong
setup_kong.bat
```

### CORS não funciona
```bash
# Verificar plugin CORS
curl http://localhost:8001/services/chat-api/plugins

# Recriar plugin CORS
curl -X DELETE http://localhost:8001/plugins/{plugin-id}
curl -X POST http://localhost:8001/services/chat-api/plugins \
  -H "Content-Type: application/json" \
  -d '{"name": "cors", "config": {"origins": ["*"]}}'
```

## Performance

### Otimizações
1. **Connection Pooling**: Configurar pools de conexão
2. **Caching**: Implementar cache de respostas
3. **Load Balancing**: Distribuir carga entre múltiplas instâncias
4. **Compression**: Habilitar compressão gzip

### Métricas Importantes
- **Throughput**: > 1000 req/s
- **Latência**: < 50ms
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%

## Segurança

### Headers de Segurança
```json
{
  "name": "response-transformer",
  "config": {
    "add": {
      "headers": [
        "X-Content-Type-Options: nosniff",
        "X-Frame-Options: DENY",
        "X-XSS-Protection: 1; mode=block"
      ]
    }
  }
}
```

### Autenticação
```json
{
  "name": "key-auth",
  "config": {
    "key_names": ["apikey"],
    "hide_credentials": false
  }
}
```

## Integração com o Sistema

### Frontend (Angular)
- Todas as requisições passam pelo Kong
- CORS configurado automaticamente
- Rate limiting transparente

### Backend (Django)
- Middleware para detectar Kong
- Headers adicionais incluídos
- Logs de requisições via Kong

### RabbitMQ
- Management UI acessível via Kong
- Isolamento de rede
- Monitoramento centralizado 