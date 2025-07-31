@echo off
echo Iniciando o Backend Django...
echo.

REM Ativar ambiente virtual
if exist venv\Scripts\activate.bat (
    echo Ativando ambiente virtual...
    call venv\Scripts\activate.bat
) else (
    echo Criando ambiente virtual...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Instalando dependencias...
    pip install -r requirements.txt
)

echo.
echo Executando migracoes...
python manage.py makemigrations
python manage.py migrate

echo.
echo Iniciando servidor Django...
echo Backend disponivel em: http://localhost:8000
echo.
python manage.py runserver 