@echo off
echo Iniciando o Frontend Angular...
echo.

REM Verificar se node_modules existe
if not exist node_modules (
    echo Instalando dependencias...
    npm install
)

echo.
echo Iniciando servidor Angular...
echo Frontend disponivel em: http://localhost:4200
echo.
ng serve 