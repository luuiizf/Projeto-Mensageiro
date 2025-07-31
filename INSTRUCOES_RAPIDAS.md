# Instruções Rápidas - Mensageiro MOM

## 🚀 Execução em 4 Passos

### 1. Instalar RabbitMQ
```bash
# Windows (via winget)
winget install RabbitMQ.RabbitMQ

# Ou baixe de: https://www.rabbitmq.com/download.html
```

### 2. Instalar Kong Gateway
```bash
# Windows (via Chocolatey)
choco install kong

# Ou baixe de: https://konghq.com/install/
```

### 3. Executar o Sistema
```bash
# Opção A: Script automático
run_project.bat

# Opção B: Manual
# Terminal 1 - Kong Gateway
cd kong
kong start

# Terminal 2 - Backend
cd mensageiroBackend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Terminal 3 - Frontend
cd Mensageiro-MOM
npm install
ng serve
```

### 4. Acessar
- **Chat**: http://localhost:4200
- **API via Kong**: http://localhost:8000/api
- **Kong Admin**: http://localhost:8001
- **RabbitMQ Management**: http://localhost:15672
- **RabbitMQ via Kong**: http://localhost:8000/rabbitmq

## 🎯 Como Usar

1. **Digite seu nome** no campo "Seu nome"
2. **Crie uma sala** digitando o nome e clicando "Criar Sala"
3. **Selecione uma sala** da lista
4. **Envie mensagens** digitando e pressionando Enter

## 🔧 Troubleshooting

### RabbitMQ não conecta
```bash
# Verificar se está rodando
netstat -an | findstr 5672
```

### Backend não inicia
```bash
# Verificar Python
python --version

# Reinstalar dependências
pip install -r requirements.txt
```

### Frontend não carrega
```bash
# Verificar Node.js
node --version

# Reinstalar dependências
npm install
```

## 📊 Testes

### Teste de Publicação
1. Envie uma mensagem
2. Verifique em http://localhost:15672
3. Confirme que aparece na fila

### Teste de Consumo
1. Abra 2 abas do chat
2. Envie mensagens de cada aba
3. Verifique se ambas recebem as mensagens

## 🎯 Funcionalidades Implementadas

✅ **Publicador/Produtor**: Envio de mensagens via API
✅ **Assinante/Consumidor**: Recebimento via polling
✅ **MOM**: RabbitMQ como message broker
✅ **API Gateway**: Kong para gerenciamento de rotas
✅ **Interface**: Chat simples e funcional
✅ **Teste Fácil**: Scripts de execução automática

## 📁 Estrutura do Projeto

```
Mensageiro-MOM/
├── mensageiroBackend/     # Django API
├── Mensageiro-MOM/        # Angular Frontend
├── kong/                  # Kong API Gateway
├── run_project.bat        # Script principal
└── README.md             # Documentação completa
```

## 🚀 Próximos Passos

1. Execute o sistema
2. Teste as funcionalidades
3. Verifique o RabbitMQ Management
4. Explore a documentação técnica 