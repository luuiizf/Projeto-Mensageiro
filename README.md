# Mensageiro-MOM
Sistema de chat utilizando RabbitMQ como Message-Oriented Middleware (MOM) e Kong como API Gateway

## Arquitetura

Este projeto implementa um sistema de chat distribuído com os seguintes componentes:

- **Frontend**: Angular (Interface de chat)
- **API Gateway**: Kong (Gerenciamento de rotas e proxy)
- **Backend**: Django REST Framework (API Gateway)
- **Message Broker**: RabbitMQ (MOM)

## Funcionalidades

- ✅ Publicação/Produção de mensagens
- ✅ Assinatura/Consumo de mensagens
- ✅ Interface de chat em tempo real
- ✅ Gerenciamento de tópicos/filas
- ✅ API Gateway com Kong
- ✅ Teste fácil com execução local

## Estrutura do Projeto

```
Mensageiro-MOM/
├── mensageiroBackend/     # API Django REST Framework
│   ├── backend/           # App Django principal
│   ├── mensageiroBackend/ # Configurações Django
│   ├── requirements.txt   # Dependências Python
│   └── run_backend.bat   # Script de execução
├── Mensageiro-MOM/        # Aplicação Angular
│   ├── src/app/          # Componentes Angular
│   ├── package.json      # Dependências Node.js
│   └── run_frontend.bat  # Script de execução
├── kong/                  # Configurações Kong
│   ├── kong.yml          # Configuração Kong
│   └── run_kong.bat      # Script Kong
├── run_project.bat       # Script principal
└── README.md
```

## Pré-requisitos

- Python 3.8+
- Node.js 18+
- RabbitMQ Server
- Kong Gateway

## Instalação dos Serviços

### RabbitMQ
```bash
# Windows (via winget)
winget install RabbitMQ.RabbitMQ

# Ou baixe de: https://www.rabbitmq.com/download.html
```

### Kong Gateway
```bash
# Windows (via Chocolatey)
choco install kong

# Ou baixe de: https://konghq.com/install/
```

## Execução Rápida

### Opção 1: Script Automático
```bash
# Execute o script principal
run_project.bat
```

### Opção 2: Execução Manual

#### 1. Configurar Kong
```bash
cd kong
kong start
```

#### 2. Configurar Backend
```bash
cd mensageiroBackend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

#### 3. Configurar Frontend
```bash
cd Mensageiro-MOM
npm install
ng serve
```

#### 4. Acessar Aplicação
- Chat: http://localhost:4200
- API via Kong: http://localhost:8001
- Kong Admin: http://localhost:8001
- RabbitMQ Management: http://localhost:15672

## Como Usar

1. **Acesse o chat**: http://localhost:4200
2. **Digite seu nome**: No campo "Seu nome"
3. **Crie uma sala**: Digite o nome da sala e clique "Criar Sala"
4. **Selecione uma sala**: Clique em uma sala da lista
5. **Envie mensagens**: Digite sua mensagem e pressione Enter

## API Endpoints (via Kong)

### Salas
- `GET /api/rooms/` - Listar salas
- `POST /api/rooms/` - Criar sala
- `GET /api/rooms/{id}/messages/` - Mensagens da sala

### Mensagens
- `GET /api/messages/` - Listar mensagens
- `POST /api/send-message/` - Enviar mensagem
- `GET /api/messages/{room_name}/` - Mensagens por sala

### RabbitMQ
- `GET /api/rabbitmq/status/` - Status da conexão
- `POST /api/rabbitmq/test_connection/` - Testar conexão

## Tecnologias Utilizadas

- **Angular 17**: Frontend framework
- **Django 4.2**: Backend framework
- **Django REST Framework**: API REST
- **Kong Gateway**: API Gateway
- **RabbitMQ**: Message broker
- **Pika**: Cliente Python para RabbitMQ
