# 🚀 Sistema Mensageiro - Arquitetura Completa REST/SOAP

Sistema completo de mensagens que integra **REST**, **SOAP**, **API Gateway** e **Message-Oriented Middleware (MOM)** em uma arquitetura robusta e escalável.

## 📋 Funcionalidades

### ✅ Atividade 1 - MOM (Message-Oriented Middleware)
- ✅ **Processos Publicadores/Produtores**: Backend Django publica mensagens
- ✅ **Processos Assinantes/Consumidores**: RabbitMQ processa mensagens
- ✅ **RabbitMQ**: Message broker para comunicação assíncrona
- ✅ **API Gateway**: Kong para roteamento e controle
- ✅ **Cliente Web**: Interface Angular para interação

### ✅ Atividade 2 - Integração REST/SOAP + API Gateway
- ✅ **API Gateway**: Kong com roteamento para REST e SOAP
- ✅ **HATEOAS**: Implementado em todas as respostas REST
- ✅ **Documentação Swagger**: API totalmente documentada
- ✅ **2+ APIs**: REST (chat/notificações) + SOAP (arquivos)
- ✅ **Cliente Web**: Angular consumindo REST via Gateway
- ✅ **Servidor SOAP**: Python/Spyne com WSDL completo
- ✅ **Cliente SOAP**: Node.js em linguagem diferente do servidor
- ✅ **WSDL**: Arquivo gerado automaticamente com todas as tags

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Frontend      │    │     Kong     │    │   Backend       │
│   Angular       │◄──►│   Gateway    │◄──►│   Django REST   │
│   (Port 4200)   │    │  (Port 8001) │    │   (Port 8000)   │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │                       │
                              │                       ▼
                              │              ┌─────────────────┐
                              │              │    RabbitMQ     │
                              │              │   (Port 5672)   │
                              │              └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  SOAP Service   │
                       │ Python/Flask    │
                       │  (Port 8001)    │
                       └─────────────────┘
                              ▲
                              │
                       ┌─────────────────┐
                       │  SOAP Client    │
                       │    Node.js      │
                       └─────────────────┘
```

## 🛠️ Tecnologias

### Backend
- **Django REST Framework**: API REST principal
- **Spyne**: Servidor SOAP para upload de arquivos
- **RabbitMQ**: Message broker (MOM)
- **SQLite**: Banco de dados
- **Kong**: API Gateway

### Frontend
- **Angular**: Cliente web principal
- **Node.js**: Cliente SOAP independente

### Integrações
- **HATEOAS**: Links hipermídia em todas as respostas
- **Swagger**: Documentação automática da API
- **CORS**: Configurado para integração cross-origin

## 🚀 Como Executar

### Opção 1: Execução Automática (Recomendada)
\`\`\`bash
# Execute todos os serviços de uma vez
run_all_services.bat
\`\`\`

### Opção 2: Execução Manual

#### 1. RabbitMQ
\`\`\`bash
# Instalar e iniciar RabbitMQ
rabbitmq-server
\`\`\`

#### 2. Backend Django
\`\`\`bash
cd mensageiroBackend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
\`\`\`

#### 3. Servidor SOAP
\`\`\`bash
cd mensageiroBackend
python soap_service/server.py
\`\`\`

#### 4. Kong Gateway
\`\`\`bash
cd kong
kong start -c kong.conf
\`\`\`

#### 5. Frontend Angular
\`\`\`bash
cd Mensageiro-MOM
npm install
ng serve
\`\`\`

#### 6. Cliente SOAP (Opcional)
\`\`\`bash
cd soap_client
npm install
node client.js
\`\`\`

## 🌐 Endpoints e Serviços

### REST API (via Kong Gateway)
- **API Root**: `http://localhost:8001/api/`
- **Documentação**: `http://localhost:8001/swagger/`
- **Usuários**: `http://localhost:8001/api/users/`
- **Salas**: `http://localhost:8001/api/rooms/`
- **Mensagens**: `http://localhost:8001/api/messages/`
- **Notificações**: `http://localhost:8001/api/notifications/`

### SOAP Service
- **WSDL**: `http://localhost:8001?wsdl`
- **Operações**:
  - `upload_file`: Upload de arquivos
  - `download_file`: Download de arquivos
  - `list_files`: Listar arquivos por sala

### Frontend
- **Angular App**: `http://localhost:4200`

### Monitoramento
- **RabbitMQ Management**: `http://localhost:15672` (guest/guest)

## 📖 HATEOAS - Hypermedia as the Engine of Application State

Todas as respostas da API REST incluem links hipermídia no campo `_links`:

\`\`\`json
{
  "id": "123",
  "username": "usuario",
  "_links": {
    "self": {
      "href": "/api/users/123/",
      "method": "GET"
    },
    "update": {
      "href": "/api/users/123/",
      "method": "PUT"
    },
    "messages": {
      "href": "/api/messages/?sender=123",
      "method": "GET"
    }
  }
}
\`\`\`

## 📄 WSDL - Web Services Description Language

O arquivo WSDL é gerado automaticamente e contém:

### Principais Tags:
- `<definitions>`: Namespace e importações
- `<types>`: Tipos de dados complexos
- `<message>`: Mensagens de entrada/saída
- `<portType>`: Operações disponíveis
- `<binding>`: Protocolo de transmissão
- `<service>`: Endpoints do serviço

### Como o Cliente Node.js Utiliza o WSDL:
1. **Requisição GET** para obter o WSDL
2. **Parse XML** para extrair operações e tipos
3. **Criação de métodos** JavaScript para cada operação
4. **Serialização** de parâmetros para XML SOAP
5. **Envio POST** com envelope SOAP
6. **Deserialização** da resposta XML

## 🧪 Testes

### Testar Cliente SOAP
\`\`\`bash
cd soap_client
node test_client.js
\`\`\`

### Testar API REST
\`\`\`bash
# Via Swagger UI
http://localhost:8001/swagger/

# Via curl
curl -X GET http://localhost:8001/api/
\`\`\`

## 📁 Estrutura do Projeto

\`\`\`
ProjetoMensageiro/
├── Mensageiro-MOM/          # Frontend Angular
├── mensageiroBackend/       # Backend Django
│   ├── backend/            # App principal REST
│   ├── notifications_api/  # API de notificações
│   └── soap_service/       # Servidor SOAP
├── soap_client/            # Cliente SOAP Node.js
├── kong/                   # Configuração Kong
└── run_all_services.bat    # Script de inicialização
\`\`\`

## 🔧 Configurações

### Kong Gateway
- **Rate Limiting**: 100/min, 1000/hora
- **CORS**: Configurado para todos os origins
- **Headers**: X-Gateway, X-Service adicionados

### RabbitMQ
- **Host**: localhost:5672
- **Management**: localhost:15672
- **Credentials**: guest/guest

### Banco de Dados
- **SQLite**: Desenvolvimento
- **Migrações**: Automáticas

## 🎯 Casos de Uso

### 1. Chat em Tempo Real
1. Usuário faz login via REST
2. Entra em uma sala de chat
3. Envia mensagem via REST
4. Mensagem é publicada no RabbitMQ
5. Outros usuários recebem via WebSocket

### 2. Compartilhamento de Arquivos
1. Usuário usa cliente SOAP Node.js
2. Faz upload de arquivo via SOAP
3. Arquivo é salvo no servidor
4. Notificação é enviada via RabbitMQ
5. Chat mostra arquivo compartilhado

### 3. Sistema de Notificações
1. Eventos geram notificações
2. API REST gerencia notificações
3. HATEOAS fornece links relacionados
4. Frontend consome via Gateway

## 🔒 Segurança

- **Kong Gateway**: Rate limiting e validação
- **CORS**: Configurado adequadamente
- **Headers**: Sanitização automática
- **Middleware**: Logging e monitoramento

## 📈 Monitoramento

- **Logs**: Django logging configurado
- **RabbitMQ**: Interface de management
- **Kong**: Métricas de gateway
- **Swagger**: Documentação em tempo real

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

---

**Desenvolvido para as disciplinas de Sistemas Distribuídos**
- ✅ Implementação de MOM com RabbitMQ
- ✅ Integração REST/SOAP com API Gateway
- ✅ HATEOAS e documentação completa
- ✅ Arquitetura distribuída e escalável
