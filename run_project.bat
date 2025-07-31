@echo off
echo ========================================
echo    MENSAGEIRO MOM - SISTEMA DE CHAT
echo ========================================
echo.
echo Este script ira iniciar o sistema completo:
echo - Kong API Gateway (porta 8000/8001)
echo - Backend Django (porta 8000)
echo - Frontend Angular (porta 4200)
echo.
echo Certifique-se de que o RabbitMQ esta rodando!
echo.
pause

echo.
echo Iniciando Kong API Gateway...
start "Kong Gateway" cmd /k "cd kong && run_kong.bat"

echo.
echo Aguardando 3 segundos para o Kong inicializar...
timeout /t 3 /nobreak > nul

echo.
echo Iniciando Backend...
start "Backend Django" cmd /k "cd mensageiroBackend && run_backend.bat"

echo.
echo Aguardando 5 segundos para o backend inicializar...
timeout /t 5 /nobreak > nul

echo.
echo Iniciando Frontend...
start "Frontend Angular" cmd /k "cd Mensageiro-MOM && run_frontend.bat"

echo.
echo ========================================
echo    SISTEMA INICIADO COM SUCESSO!
echo ========================================
echo.
echo URLs disponiveis:
echo - Chat: http://localhost:4200
echo - API via Kong: http://localhost:8000/api
echo - Kong Admin: http://localhost:8001
echo - RabbitMQ Management: http://localhost:15672
echo - RabbitMQ via Kong: http://localhost:8000/rabbitmq
echo.
echo Pressione qualquer tecla para sair...
pause > nul 