@echo off
echo === Testes do Cliente SOAP ===
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
echo Executando testes automatizados...
node test_client.js

pause
