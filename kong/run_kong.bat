@echo off
echo ========================================
echo    INICIANDO KONG API GATEWAY
echo ========================================
echo.

REM Verificar se Kong está instalado
kong version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Kong nao encontrado!
    echo Instale o Kong primeiro:
    echo choco install kong
    echo ou baixe de: https://konghq.com/install/
    pause
    exit /b 1
)

echo Kong encontrado. Versao:
kong version

echo.
echo Parando Kong se estiver rodando...
kong stop >nul 2>&1

echo.
echo Iniciando Kong...
kong start

if errorlevel 1 (
    echo ERRO: Falha ao iniciar Kong!
    echo Verifique se a porta 8000/8001 esta livre
    pause
    exit /b 1
)

echo.
echo Kong iniciado com sucesso!
echo.
echo Configurando servicos...
call setup_kong.bat

echo.
echo URLs disponiveis:
echo - Kong Admin: http://localhost:8001
echo - Kong Proxy: http://localhost:8000
echo - Chat API via Kong: http://localhost:8000/api
echo - RabbitMQ via Kong: http://localhost:8000/rabbitmq
echo.
echo Pressione Ctrl+C para parar o Kong
echo.

REM Aguardar indefinidamente
pause >nul 