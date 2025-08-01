from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import json
import os
import uuid
from .models import ChatRoom, Message, RabbitMQConnection, User, Notification
from .serializers import (
    ChatRoomSerializer, MessageSerializer, RabbitMQConnectionSerializer,
    SendMessageSerializer, UserSerializer, UserRegistrationSerializer, UserLoginSerializer, NotificationSerializer


)
from .rabbitmq_service import get_rabbitmq_service, RabbitMQService

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user)
        
        # Adicionar HATEOAS
        response_data = serializer.data
        response_data['_links'] = {
            'self': {
                'href': f'/api/users/{user.id}/',
                'method': 'GET'
            },
            'update': {
                'href': f'/api/users/{user.id}/',
                'method': 'PUT'
            },
            'delete': {
                'href': f'/api/users/{user.id}/',
                'method': 'DELETE'
            },
            'messages': {
                'href': f'/api/messages/?sender={user.id}',
                'method': 'GET'
            },
            'notifications': {
                'href': f'/api/notifications/?user_id={user.id}',
                'method': 'GET'
            },
            'all_users': {
                'href': '/api/users/',
                'method': 'GET'
            }
        }
        
        return Response(response_data)

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            response_data = {
                'message': 'Usuário registrado com sucesso',
                'user': UserSerializer(user).data
            }
            
            # Adicionar HATEOAS
            response_data['_links'] = {
                'login': {
                    'href': '/api/users/login/',
                    'method': 'POST'
                },
                'user_profile': {
                    'href': f'/api/users/{user.id}/',
                    'method': 'GET'
                },
                'all_users': {
                    'href': '/api/users/',
                    'method': 'GET'
                }
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.last_login = timezone.now()
            user.save()
            
            response_data = {
                'message': 'Login realizado com sucesso',
                'user': UserSerializer(user).data
            }
            
            # Adicionar HATEOAS
            response_data['_links'] = {
                'user_profile': {
                    'href': f'/api/users/{user.id}/',
                    'method': 'GET'
                },
                'rooms': {
                    'href': '/api/rooms/',
                    'method': 'GET'
                },
                'send_message': {
                    'href': '/api/send-message/',
                    'method': 'POST'
                },
                'notifications': {
                    'href': f'/api/notifications/?user_id={user.id}',
                    'method': 'GET'
                },
                'notification_stats': {
                    'href': f'/api/notifications/stats/?user_id={user.id}',
                    'method': 'GET'
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """Listar usuários com HATEOAS"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Adicionar links HATEOAS
        for item in serializer.data:
            item['_links'] = {
                'self': {'href': f"/api/users/{item['id']}/"},
                'messages': {'href': f"/api/users/{item['id']}/messages/"},
                'notifications': {'href': f"/api/notifications/?user_id={item['id']}"}
            }
        
        return Response({
            'users': serializer.data,
            '_links': {
                'self': {'href': '/api/users/'},
                'create': {'href': '/api/users/'},
                'login': {'href': '/api/users/login/'},
                'register': {'href': '/api/users/register/'}
            }
        })

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        room = self.get_object()
        serializer = self.get_serializer(room)
        
        # Adicionar HATEOAS
        response_data = serializer.data
        response_data['_links'] = {
            'self': {
                'href': f'/api/rooms/{room.id}/',
                'method': 'GET'
            },
            'messages': {
                'href': f'/api/rooms/{room.id}/messages/',
                'method': 'GET'
            },
            'send_message': {
                'href': f'/api/rooms/{room.id}/send_message/',
                'method': 'POST'
            },
            'update': {
                'href': f'/api/rooms/{room.id}/',
                'method': 'PUT'
            },
            'delete': {
                'href': f'/api/rooms/{room.id}/',
                'method': 'DELETE'
            },
            'all_rooms': {
                'href': '/api/rooms/',
                'method': 'GET'
            },
            'soap_file_upload': {
                'href': 'http://localhost:8001?wsdl',
                'method': 'SOAP',
                'description': 'Upload de arquivos via SOAP'
            }
        }
        
        return Response(response_data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save()
            
            response_data = {
                'message': 'Sala criada com sucesso',
                'room': ChatRoomSerializer(room).data
            }
            
            # Adicionar HATEOAS
            response_data['_links'] = {
                'room_details': {
                    'href': f'/api/rooms/{room.id}/',
                    'method': 'GET'
                },
                'messages': {
                    'href': f'/api/rooms/{room.id}/messages/',
                    'method': 'GET'
                },
                'send_message': {
                    'href': f'/api/rooms/{room.id}/send_message/',
                    'method': 'POST'
                },
                'all_rooms': {
                    'href': '/api/rooms/',
                    'method': 'GET'
                }
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        room = self.get_object()
        messages = room.messages.all()
        serializer = MessageSerializer(messages, many=True)
        
        response_data = {
            'room': ChatRoomSerializer(room).data,
            'messages': serializer.data,
            '_links': {
                'room_details': {
                    'href': f'/api/rooms/{room.id}/',
                    'method': 'GET'
                },
                'send_message': {
                    'href': f'/api/rooms/{room.id}/send_message/',
                    'method': 'POST'
                },
                'all_rooms': {
                    'href': '/api/rooms/',
                    'method': 'GET'
                }
            }
        }
        
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        room = self.get_object()
        serializer = SendMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            sender_id = serializer.validated_data['sender_id']
            content = serializer.validated_data['content']
            message_type = serializer.validated_data['message_type']
            
            try:
                sender = User.objects.get(id=sender_id, is_active=True)
                message = Message.objects.create(
                    room=room,
                    sender=sender,
                    content=content,
                    message_type=message_type
                )
                
                message_data = {
                    'id': str(message.id),
                    'room_name': room.name,
                    'sender_username': sender.username,
                    'content': message.content,
                    'timestamp': message.timestamp.isoformat(),
                    'message_type': message.message_type
                }
                
                rabbitmq_service = get_rabbitmq_service()
                success = rabbitmq_service.publish_message(message_data)
                
                if success:
                    response_data = {
                        'message': 'Mensagem enviada com sucesso',
                        'data': MessageSerializer(message).data
                    }
                    
                    # Adicionar HATEOAS
                    response_data['_links'] = {
                        'message_details': {
                            'href': f'/api/messages/{message.id}/',
                            'method': 'GET'
                        },
                        'room_messages': {
                            'href': f'/api/rooms/{room.id}/messages/',
                            'method': 'GET'
                        },
                        'room_details': {
                            'href': f'/api/rooms/{room.id}/',
                            'method': 'GET'
                        },
                        'sender_profile': {
                            'href': f'/api/users/{sender.id}/',
                            'method': 'GET'
                        }
                    }
                    
                    return Response(response_data, status=status.HTTP_201_CREATED)
                else:
                    return Response(
                        {'error': 'Erro ao enviar mensagem para RabbitMQ'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except User.DoesNotExist:
                return Response(
                    {'error': 'Usuário não encontrado'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """Listar salas com HATEOAS"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Adicionar links HATEOAS
        for item in serializer.data:
            item['_links'] = {
                'self': {'href': f"/api/rooms/{item['id']}/"},
                'messages': {'href': f"/api/messages/{item['name']}/"},
                'join': {'href': f"/api/rooms/{item['id']}/join/"},
                'files': {'href': f"/api/rooms/{item['name']}/files/"}
            }
        
        return Response({
            'rooms': serializer.data,
            '_links': {
                'self': {'href': '/api/rooms/'},
                'create': {'href': '/api/rooms/'}
            }
        })

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Message.objects.all()
        room_name = self.request.query_params.get('room', None)
        sender_id = self.request.query_params.get('sender', None)
        
        if room_name is not None:
            queryset = queryset.filter(room__name=room_name)
        if sender_id is not None:
            queryset = queryset.filter(sender_id=sender_id)
            
        return queryset

    def retrieve(self, request, *args, **kwargs):
        message = self.get_object()
        serializer = self.get_serializer(message)
        
        # Adicionar HATEOAS
        response_data = serializer.data
        response_data['_links'] = {
            'self': {
                'href': f'/api/messages/{message.id}/',
                'method': 'GET'
            },
            'room': {
                'href': f'/api/rooms/{message.room.id}/',
                'method': 'GET'
            },
            'sender': {
                'href': f'/api/users/{message.sender.id}/',
                'method': 'GET'
            },
            'room_messages': {
                'href': f'/api/rooms/{message.room.id}/messages/',
                'method': 'GET'
            },
            'all_messages': {
                'href': '/api/messages/',
                'method': 'GET'
            }
        }
        
        return Response(response_data)

class RabbitMQConnectionViewSet(viewsets.ModelViewSet):
    queryset = RabbitMQConnection.objects.all()
    serializer_class = RabbitMQConnectionSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def test_connection(self, request):
        try:
            rabbitmq_service = get_rabbitmq_service()
            success = rabbitmq_service.test_connection()
            
            response_data = {
                'status': 'connected' if success else 'disconnected',
                'message': 'Conexão testada com sucesso' if success else 'Erro na conexão',
                '_links': {
                    'status': {
                        'href': '/api/rabbitmq/status/',
                        'method': 'GET'
                    },
                    'connections': {
                        'href': '/api/rabbitmq/',
                        'method': 'GET'
                    }
                }
            }
            
            return Response(response_data)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e),
                '_links': {
                    'retry': {
                        'href': '/api/rabbitmq/test_connection/',
                        'method': 'POST'
                    }
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def status(self, request):
        try:
            rabbitmq_service = get_rabbitmq_service()
            success = rabbitmq_service.test_connection()
            
            response_data = {
                'status': 'connected' if success else 'disconnected',
                '_links': {
                    'test_connection': {
                        'href': '/api/rabbitmq/test_connection/',
                        'method': 'POST'
                    },
                    'connections': {
                        'href': '/api/rabbitmq/',
                        'method': 'GET'
                    }
                }
            }
            
            return Response(response_data)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e),
                '_links': {
                    'test_connection': {
                        'href': '/api/rabbitmq/test_connection/',
                        'method': 'POST'
                    }
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING),
            'password': openapi.Schema(type=openapi.TYPE_STRING),
            'password_confirm': openapi.Schema(type=openapi.TYPE_STRING),
            'email': openapi.Schema(type=openapi.TYPE_STRING),
        }
    ),
    responses={201: 'Usuário criado com sucesso'}
)
@api_view(['POST'])
def register_user(request):
    """Registrar novo usuário"""
    data = request.data
    
    if data['password'] != data['password_confirm']:
        return Response({'error': 'Senhas não coincidem'}, status=400)
    
    if User.objects.filter(username=data['username']).exists():
        return Response({'error': 'Usuário já existe'}, status=400)
    
    user = User.objects.create_user(
        username=data['username'],
        password=data['password'],
        email=data.get('email', '')
    )
    
    # Criar notificação de boas-vindas
    Notification.objects.create(
        user=user,
        notification_type='system',
        title='Bem-vindo ao Mensageiro MOM!',
        message='Sua conta foi criada com sucesso. Comece criando ou entrando em uma sala de chat.',
        priority='medium'
    )
    
    serializer = UserSerializer(user)
    response_data = serializer.data
    response_data['_links'] = {
        'self': {'href': f"/api/users/{user.id}/"},
        'login': {'href': '/api/users/login/'},
        'notifications': {'href': f"/api/notifications/?user_id={user.id}"}
    }
    
    return Response(response_data, status=201)

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING),
            'password': openapi.Schema(type=openapi.TYPE_STRING),
        }
    ),
    responses={200: 'Login realizado com sucesso'}
)
@api_view(['POST'])
def login_user(request):
    """Login do usuário"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        user.last_login = timezone.now()
        user.save()
        
        serializer = UserSerializer(user)
        response_data = serializer.data
        response_data['_links'] = {
            'self': {'href': f"/api/users/{user.id}/"},
            'rooms': {'href': '/api/rooms/'},
            'notifications': {'href': f"/api/notifications/?user_id={user.id}"}
        }
        
        return Response(response_data)
    
    return Response({'error': 'Credenciais inválidas'}, status=401)

@api_view(['GET'])
def get_messages(request, room_name):
    """Obter mensagens de uma sala com HATEOAS"""
    try:
        room = ChatRoom.objects.get(name=room_name)
        messages = Message.objects.filter(room=room).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        
        # Adicionar links HATEOAS
        for item in serializer.data:
            item['_links'] = {
                'self': {'href': f"/api/messages/{item['id']}/"},
                'room': {'href': f"/api/rooms/{room.id}/"},
                'sender': {'href': f"/api/users/{item['sender']}/"}
            }
        
        return Response({
            'messages': serializer.data,
            'room': room_name,
            '_links': {
                'self': {'href': f"/api/messages/{room_name}/"},
                'room': {'href': f"/api/rooms/{room.id}/"},
                'send_message': {'href': '/api/send-message/'}
            }
        })
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Sala não encontrada'}, status=404)

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'room_name': openapi.Schema(type=openapi.TYPE_STRING),
            'sender_id': openapi.Schema(type=openapi.TYPE_STRING),
            'content': openapi.Schema(type=openapi.TYPE_STRING),
            'message_type': openapi.Schema(type=openapi.TYPE_STRING),
        }
    )
)
@api_view(['POST'])
def send_message(request):
    """Enviar mensagem"""
    try:
        room = ChatRoom.objects.get(name=request.data['room_name'])
        sender = User.objects.get(id=request.data['sender_id'])
        
        message = Message.objects.create(
            room=room,
            sender=sender,
            content=request.data['content'],
            message_type=request.data.get('message_type', 'text')
        )
        
        # Enviar via RabbitMQ
        rabbitmq = RabbitMQService()
        rabbitmq.send_message(request.data['room_name'], {
            'id': str(message.id),
            'room': str(room.id),
            'room_name': room.name,
            'sender': str(sender.id),
            'sender_username': sender.username,
            'content': message.content,
            'timestamp': message.timestamp.isoformat(),
            'message_type': message.message_type
        })
        
        # Criar notificações para outros usuários na sala
        # Para um sistema real, você teria uma tabela de membros da sala
        # Por ora, vamos notificar todos os outros usuários
        other_users = User.objects.exclude(id=sender.id)
        for user in other_users:
            Notification.objects.create(
                user=user,
                room=room,
                notification_type='message',
                title=f'Nova mensagem em #{room.name}',
                message=f'{sender.username}: {message.content[:50]}{"..." if len(message.content) > 50 else ""}',
                priority='medium',
                data={
                    'message_id': str(message.id),
                    'sender_id': str(sender.id),
                    'sender_username': sender.username
                }
            )
        
        serializer = MessageSerializer(message)
        response_data = serializer.data
        response_data['_links'] = {
            'self': {'href': f"/api/messages/{message.id}/"},
            'room': {'href': f"/api/rooms/{room.id}/"},
            'sender': {'href': f"/api/users/{sender.id}/"}
        }
        
        return Response(response_data, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
def rabbitmq_status(request):
    """Status do RabbitMQ com HATEOAS"""
    try:
        rabbitmq = RabbitMQService()
        status = rabbitmq.get_connection_status()
        
        return Response({
            'status': status,
            'timestamp': timezone.now().isoformat(),
            '_links': {
                'self': {'href': '/api/rabbitmq/status/'},
                'test_connection': {'href': '/api/rabbitmq/test_connection/'}
            }
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e),
            'timestamp': timezone.now().isoformat(),
            '_links': {
                'self': {'href': '/api/rabbitmq/status/'},
                'test_connection': {'href': '/api/rabbitmq/test_connection/'}
            }
        })

@api_view(['GET'])
def download_file(request, file_id):
    """Download de arquivo via REST"""
    try:
        upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
        
        # Procurar arquivo com o ID
        for filename in os.listdir(upload_dir):
            if filename.startswith(file_id):
                file_path = os.path.join(upload_dir, filename)
                
                with open(file_path, 'rb') as f:
                    response = HttpResponse(f.read())
                    response['Content-Disposition'] = f'attachment; filename="{filename}"'
                    return response
        
        raise Http404("Arquivo não encontrado")
        
    except Exception as e:
        return Response({'error': str(e)}, status=404)

@api_view(['GET'])
def kong_status(request):
    return Response({
        'status': 'connected',
        'gateway': 'Kong',
        'service': 'Chat-API',
        'timestamp': timezone.now().isoformat(),
        'headers': {
            'X-Gateway': request.META.get('HTTP_X_GATEWAY', 'Not Set'),
            'X-Service': request.META.get('HTTP_X_SERVICE', 'Not Set'),
            'X-Request-ID': request.META.get('HTTP_X_REQUEST_ID', 'Not Set'),
        }
    })
# def kong_status(request):
#     """Status do Kong Gateway"""
#     import requests
    
#     try:
#         # Verificar Kong Admin API
#         response = requests.get('http://localhost:8001/', timeout=5)
        
#         return Response({
#             'gateway': 'Kong',
#             'service': 'Mensageiro MOM',
#             'status': 'connected' if response.status_code == 200 else 'disconnected',
#             'timestamp': timezone.now().isoformat(),
#             'headers': dict(response.headers),
#             '_links': {
#                 'self': {'href': '/api/kong/status/'},
#                 'admin': {'href': 'http://localhost:8001/'},
#                 'gateway': {'href': 'http://localhost:8000/'}
#             }
#         })
        
#     except Exception as e:
#         return Response({
#             'gateway': 'Kong',
#             'service': 'Mensageiro MOM',
#             'status': 'disconnected',
#             'error': str(e),
#             'timestamp': timezone.now().isoformat(),
#             '_links': {
#                 'self': {'href': '/api/kong/status/'}
#             }
#         })

@api_view(['GET'])
def api_root(request):
    """Endpoint raiz da API com HATEOAS completo"""
    response_data = {
        'message': 'Bem-vindo à API do Mensageiro',
        'version': '2.0',
        'services': {
            'rest_api': 'Ativo',
            'soap_service': 'Ativo',
            'rabbitmq': 'Ativo',
            'kong_gateway': 'Ativo'
        },
        '_links': {
            'users': {
                'href': '/api/users/',
                'method': 'GET',
                'description': 'Gerenciamento de usuários'
            },
            'rooms': {
                'href': '/api/rooms/',
                'method': 'GET',
                'description': 'Salas de chat'
            },
            'messages': {
                'href': '/api/messages/',
                'method': 'GET',
                'description': 'Mensagens do chat'
            },
            'notifications': {
                'href': '/api/notifications/',
                'method': 'GET',
                'description': 'Sistema de notificações'
            },
            'send_message': {
                'href': '/api/send-message/',
                'method': 'POST',
                'description': 'Enviar mensagem'
            },
            'user_register': {
                'href': '/api/users/register/',
                'method': 'POST',
                'description': 'Registrar novo usuário'
            },
            'user_login': {
                'href': '/api/users/login/',
                'method': 'POST',
                'description': 'Login de usuário'
            },
            'kong_status': {
                'href': '/api/kong/status/',
                'method': 'GET',
                'description': 'Status do Kong Gateway'
            },
            'rabbitmq_status': {
                'href': '/api/rabbitmq/status/',
                'method': 'GET',
                'description': 'Status do RabbitMQ'
            },
            'soap_service': {
                'href': 'http://localhost:8001?wsdl',
                'method': 'SOAP',
                'description': 'Serviço SOAP para upload de arquivos'
            },
            'api_documentation': {
                'href': '/swagger/',
                'method': 'GET',
                'description': 'Documentação Swagger da API'
            }
        }
    }
    
    return Response(response_data)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Notification.objects.filter(user_id=user_id)
        return Notification.objects.all()
    
    def create(self, request, *args, **kwargs):
        serializer = CreateNotificationSerializer(data=request.data)
        if serializer.is_valid():
            notification = serializer.save()
            
            # Adicionar links HATEOAS
            response_data = NotificationSerializer(notification).data
            response_data['_links'] = {
                'self': {
                    'href': f'/api/notifications/{notification.id}/',
                    'method': 'GET'
                },
                'mark_as_read': {
                    'href': f'/api/notifications/{notification.id}/mark_as_read/',
                    'method': 'POST'
                },
                'delete': {
                    'href': f'/api/notifications/{notification.id}/',
                    'method': 'DELETE'
                },
                'user': {
                    'href': f'/api/users/{notification.user.id}/',
                    'method': 'GET'
                }
            }
            
            if notification.room:
                response_data['_links']['room'] = {
                    'href': f'/api/rooms/{notification.room.id}/',
                    'method': 'GET'
                }
            
            return Response({
                'message': 'Notificação criada com sucesso',
                'data': response_data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def list(self, request, *args, **kwargs):
        """Listar notificações com HATEOAS"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Adicionar links HATEOAS
        for item in serializer.data:
            item['_links'] = {
                'self': {'href': f"/api/notifications/{item['id']}/"},
                'mark_read': {'href': f"/api/notifications/{item['id']}/mark_read/"},
                'delete': {'href': f"/api/notifications/{item['id']}/"}
            }
        
        return Response({
            'notifications': serializer.data,
            '_links': {
                'self': {'href': '/api/notifications/'},
                'create': {'href': '/api/notifications/'},
                'mark_all_read': {'href': '/api/notifications/mark_all_read/'}
            }
        })
    
    def retrieve(self, request, *args, **kwargs):
        notification = self.get_object()
        serializer = self.get_serializer(notification)
        
        # Adicionar links HATEOAS
        response_data = serializer.data
        response_data['_links'] = {
            'self': {
                'href': f'/api/notifications/{notification.id}/',
                'method': 'GET'
            },
            'mark_as_read': {
                'href': f'/api/notifications/{notification.id}/mark_as_read/',
                'method': 'POST'
            },
            'delete': {
                'href': f'/api/notifications/{notification.id}/',
                'method': 'DELETE'
            },
            'user': {
                'href': f'/api/users/{notification.user.id}/',
                'method': 'GET'
            },
            'all_notifications': {
                'href': '/api/notifications/',
                'method': 'GET'
            }
        }
        
        if notification.room:
            response_data['_links']['room'] = {
                'href': f'/api/rooms/{notification.room.id}/',
                'method': 'GET'
            }
        
        return Response(response_data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        response_data = NotificationSerializer(notification).data
        response_data['_links'] = {
            'self': {
                'href': f'/api/notifications/{notification.id}/',
                'method': 'GET'
            },
            'mark_as_unread': {
                'href': f'/api/notifications/{notification.id}/mark_as_unread/',
                'method': 'POST'
            }
        }
        
        return Response({
            'message': 'Notificação marcada como lida',
            'data': response_data
        })
    
    @action(detail=True, methods=['post'])
    def mark_as_unread(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = False
        notification.save()
        
        response_data = NotificationSerializer(notification).data
        response_data['_links'] = {
            'self': {
                'href': f'/api/notifications/{notification.id}/',
                'method': 'GET'
            },
            'mark_as_read': {
                'href': f'/api/notifications/{notification.id}/mark_as_read/',
                'method': 'POST'
            }
        }
        
        return Response({
            'message': 'Notificação marcada como não lida',
            'data': response_data
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marcar todas as notificações como lidas"""
        user_id = request.data.get('user_id')
        if user_id:
            Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)
            return Response({
                'message': 'Todas as notificações foram marcadas como lidas',
                '_links': {
                    'list': {'href': '/api/notifications/'}
                }
            })
        
        return Response({'error': 'user_id é obrigatório'}, status=400)

@api_view(['GET'])
def notification_stats(request):
    """Estatísticas de notificações com HATEOAS"""
    user_id = request.query_params.get('user_id')
    
    if not user_id:
        return Response(
            {'error': 'user_id é obrigatório'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
        
        total = Notification.objects.filter(user=user).count()
        unread = Notification.objects.filter(user=user, is_read=False).count()
        read = total - unread
        
        stats = {
            'user_id': user_id,
            'username': user.username,
            'total_notifications': total,
            'unread_notifications': unread,
            'read_notifications': read,
            'unread_percentage': round((unread / total * 100) if total > 0 else 0, 2),
            '_links': {
                'all_notifications': {
                    'href': f'/api/notifications/?user_id={user_id}',
                    'method': 'GET'
                },
                'unread_notifications': {
                    'href': f'/api/notifications/?user_id={user_id}&is_read=false',
                    'method': 'GET'
                },
                'mark_all_as_read': {
                    'href': '/api/notifications/mark_all_as_read/',
                    'method': 'POST',
                    'body': {'user_id': user_id}
                },
                'user_profile': {
                    'href': f'/api/users/{user_id}/',
                    'method': 'GET'
                }
            }
        }
        
        return Response(stats)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Usuário não encontrado'}, 
            status=status.HTTP_404_NOT_FOUND
        )

