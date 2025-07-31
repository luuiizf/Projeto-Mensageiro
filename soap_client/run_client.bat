@echo off
echo === Mensageiro SOAP Client ===
echo.
echo Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Instalando dependencias...
npm install

echo.
echo Iniciando cliente SOAP...
node client.js

pause
