@echo off
echo ========================================
echo    CONFIGURANDO KONG API GATEWAY
echo ========================================
echo.

REM Verificar se Kong está rodando
echo Verificando se Kong esta rodando...
curl -s http://localhost:8001/status >nul 2>&1
if errorlevel 1 (
    echo ERRO: Kong nao esta rodando!
    echo Execute run_kong.bat primeiro
    pause
    exit /b 1
)

echo Kong esta rodando. Configurando servicos...

REM Configurar serviço da API
echo Configurando servico da API...
curl -X POST http://localhost:8001/services \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"chat-api\", \"url\": \"http://localhost:8000\"}"

REM Configurar rota da API
echo Configurando rota da API...
curl -X POST http://localhost:8001/services/chat-api/routes \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"chat-api-route\", \"paths\": [\"/api\"], \"strip_path\": false}"

REM Configurar plugin CORS
echo Configurando plugin CORS...
curl -X POST http://localhost:8001/services/chat-api/plugins \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"cors\", \"config\": {\"origins\": [\"*\"], \"methods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"OPTIONS\"], \"headers\": [\"Content-Type\", \"Authorization\"], \"exposed_headers\": [\"X-Total-Count\"], \"credentials\": true, \"max_age\": 3600}}"

REM Configurar plugin Rate Limiting
echo Configurando plugin Rate Limiting...
curl -X POST http://localhost:8001/services/chat-api/plugins \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"rate-limiting\", \"config\": {\"minute\": 100, \"hour\": 1000, \"policy\": \"local\"}}"

REM Configurar serviço do RabbitMQ
echo Configurando servico do RabbitMQ...
curl -X POST http://localhost:8001/services \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"rabbitmq-management\", \"url\": \"http://localhost:15672\"}"

REM Configurar rota do RabbitMQ
echo Configurando rota do RabbitMQ...
curl -X POST http://localhost:8001/services/rabbitmq-management/routes \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"rabbitmq-route\", \"paths\": [\"/rabbitmq\"], \"strip_path\": true}"

REM Configurar plugin CORS para RabbitMQ
echo Configurando plugin CORS para RabbitMQ...
curl -X POST http://localhost:8001/services/rabbitmq-management/plugins \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"cors\", \"config\": {\"origins\": [\"*\"], \"methods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"OPTIONS\"], \"headers\": [\"Content-Type\", \"Authorization\"], \"credentials\": true, \"max_age\": 3600}}"

echo.
echo ========================================
echo    CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Servicos configurados:
echo - Chat API: http://localhost:8000/api
echo - RabbitMQ: http://localhost:8000/rabbitmq
echo - Kong Admin: http://localhost:8001
echo.
echo Teste a API:
echo curl http://localhost:8000/api/kong/status/
echo.
pause 