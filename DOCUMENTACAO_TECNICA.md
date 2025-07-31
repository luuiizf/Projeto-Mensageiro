# Documentação Técnica - Mensageiro MOM

## Visão Geral da Arquitetura

O sistema Mensageiro MOM implementa um chat distribuído utilizando Message-Oriented Middleware (MOM) com RabbitMQ, seguindo os padrões de publicação/assinatura.

### Componentes Principais

1. **Frontend (Angular)**
   - Interface de usuário para chat
   - Comunicação com API REST
   - Polling para atualizações em tempo real

2. **Backend (Django REST Framework)**
   - API Gateway para gerenciamento de mensagens
   - Integração com RabbitMQ
   - Persistência de dados

3. **Message Broker (RabbitMQ)**
   - Gerenciamento de filas por sala
   - Exchange para broadcast
   - Garantia de entrega de mensagens

## Fluxo de Dados

### Publicação de Mensagens
```
Usuário → Frontend → API REST → Django → RabbitMQ → Fila da Sala
```

### Consumo de Mensagens
```
RabbitMQ → Fila da Sala → Django → API REST → Frontend → Usuário
```

## Implementação Técnica

### Backend Django

#### Modelos de Dados
- **ChatRoom**: Representa uma sala de chat
- **Message**: Representa uma mensagem individual
- **RabbitMQConnection**: Configurações de conexão

#### Serviços
- **RabbitMQService**: Gerenciamento de conexões e operações com RabbitMQ
- **ViewSets**: APIs REST para CRUD de salas e mensagens

#### Endpoints da API
```python
# Salas
GET    /api/rooms/                    # Listar salas
POST   /api/rooms/                    # Criar sala
GET    /api/rooms/{id}/messages/      # Mensagens da sala

# Mensagens
GET    /api/messages/                 # Listar mensagens
POST   /api/send-message/             # Enviar mensagem
GET    /api/messages/{room_name}/     # Mensagens por sala

# RabbitMQ
GET    /api/rabbitmq/status/          # Status da conexão
POST   /api/rabbitmq/test_connection/ # Testar conexão
```

### Frontend Angular

#### Componentes
- **ChatComponent**: Componente principal do chat
- **ChatService**: Serviço para comunicação com API

#### Funcionalidades
- Seleção de salas
- Envio de mensagens
- Atualização em tempo real via polling
- Interface responsiva

### RabbitMQ

#### Estrutura de Filas
```
chat_exchange (fanout)
├── chat_room_sala1
├── chat_room_sala2
└── chat_room_sala3
```

#### Configurações
- **Host**: localhost
- **Port**: 5672
- **Credentials**: guest/guest
- **Virtual Host**: /

## Padrões Implementados

### 1. Publicador/Produtor
- **Localização**: `backend/views.py` - `send_message()`
- **Responsabilidade**: Publicar mensagens no RabbitMQ
- **Implementação**: 
  ```python
  rabbitmq_service.publish_message(message_data)
  ```

### 2. Assinante/Consumidor
- **Localização**: `backend/rabbitmq_service.py` - `consume_messages()`
- **Responsabilidade**: Consumir mensagens do RabbitMQ
- **Implementação**:
  ```python
  self.channel.basic_consume(
      queue=room_queue,
      on_message_callback=message_handler
  )
  ```

### 3. MOM (Message-Oriented Middleware)
- **Localização**: `backend/rabbitmq_service.py`
- **Responsabilidade**: Gerenciar filas e exchanges
- **Implementação**:
  ```python
  self.channel.exchange_declare(
      exchange='chat_exchange',
      exchange_type='fanout',
      durable=True
  )
  ```

## Configurações de Desenvolvimento

### Variáveis de Ambiente
```python
# settings.py
RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'guest'
RABBITMQ_PASS = 'guest'
RABBITMQ_VHOST = '/'
```

### Dependências
```txt
# requirements.txt
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
pika==1.3.2
channels==4.0.0
channels-redis==4.1.0
redis==5.0.1
daphne==4.0.0
```

## Testes e Validação

### Teste de Publicação
1. Envie uma mensagem via interface
2. Verifique no RabbitMQ Management (http://localhost:15672)
3. Confirme que a mensagem foi publicada na fila correta

### Teste de Consumo
1. Abra múltiplas abas do chat
2. Envie mensagens de diferentes usuários
3. Verifique se todas as abas recebem as mensagens

### Teste de Filas
1. Crie múltiplas salas
2. Verifique se cada sala tem sua própria fila
3. Teste isolamento entre salas

## Monitoramento

### RabbitMQ Management
- **URL**: http://localhost:15672
- **Credenciais**: guest/guest
- **Funcionalidades**:
  - Visualizar filas e exchanges
  - Monitorar throughput
  - Verificar conexões

### Logs do Sistema
- **Backend**: Logs do Django no console
- **Frontend**: Logs do Angular no console do navegador
- **RabbitMQ**: Logs do servidor RabbitMQ

## Escalabilidade

### Possíveis Melhorias
1. **WebSocket**: Implementar comunicação real-time
2. **Redis**: Cache para melhor performance
3. **Load Balancer**: Distribuir carga entre múltiplas instâncias
4. **Microserviços**: Separar em serviços independentes
5. **Docker**: Containerização para deploy

### Considerações de Performance
- Polling atual pode ser otimizado com WebSocket
- Filas duráveis garantem persistência
- Exchange fanout permite broadcast eficiente

## Segurança

### Implementações Atuais
- CORS configurado para desenvolvimento
- Permissões AllowAny para facilitar testes
- Validação de entrada nos serializers

### Recomendações
- Implementar autenticação JWT
- Adicionar rate limiting
- Configurar HTTPS para produção
- Implementar validação de entrada mais rigorosa 