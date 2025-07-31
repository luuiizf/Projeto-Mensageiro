from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Configuração do Swagger
schema_view = get_schema_view(
    openapi.Info(
        title="Mensageiro API",
        default_version='v2.0',
        description="""
        # API do Sistema Mensageiro
        
        Sistema completo de mensagens com integração REST/SOAP e API Gateway.
        
        ## Funcionalidades
        
        ### 🔐 Autenticação
        - Registro e login de usuários
        - Gerenciamento de sessões
        
        ### 💬 Chat
        - Salas de chat em tempo real
        - Mensagens via RabbitMQ
        - Histórico de mensagens
        
        ### 📁 Arquivos (SOAP)
        - Upload de arquivos via SOAP
        - Download de arquivos
        - Listagem de arquivos por sala
        
        ### 🔔 Notificações
        - Sistema de notificações
        - Diferentes tipos e prioridades
        - Marcação de leitura
        
        ### 🌐 Gateway
        - Kong API Gateway
        - Rate limiting
        - CORS configurado
        
        ## HATEOAS
        
        Esta API implementa HATEOAS (Hypermedia as the Engine of Application State).
        Todas as respostas incluem links relacionados no campo `_links`.
        
        ## Arquitetura
        
        - **REST API**: Django REST Framework
        - **SOAP Service**: Spyne (Python)
        - **Message Queue**: RabbitMQ
        - **API Gateway**: Kong
        - **Frontend**: Angular
        - **Cliente SOAP**: Node.js
        
        ## Endpoints Principais
        
        - `/api/` - Raiz da API com links HATEOAS
        - `/api/users/` - Gerenciamento de usuários
        - `/api/rooms/` - Salas de chat
        - `/api/messages/` - Mensagens
        - `/api/notifications/` - Notificações
        - `http://localhost:8001?wsdl` - Serviço SOAP
        """,
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contato@mensageiro.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('backend.urls')),
    
    # Documentação da API
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API Root com documentação
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='api-docs'),
]

# Servir arquivos de media em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
