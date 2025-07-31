from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import ChatRoom, Message, RabbitMQConnection, User
from .serializers import (
    ChatRoomSerializer, MessageSerializer, RabbitMQConnectionSerializer,
    SendMessageSerializer, UserSerializer, UserRegistrationSerializer, UserLoginSerializer
)
from .rabbitmq_service import get_rabbitmq_service

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Usuário registrado com sucesso',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.last_login = timezone.now()
            user.save()
            return Response({
                'message': 'Login realizado com sucesso',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save()
            return Response({
                'message': 'Sala criada com sucesso',
                'room': ChatRoomSerializer(room).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        room = self.get_object()
        messages = room.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

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
                    return Response({
                        'message': 'Mensagem enviada com sucesso',
                        'data': MessageSerializer(message).data
                    }, status=status.HTTP_201_CREATED)
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

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Message.objects.all()
        room_name = self.request.query_params.get('room', None)
        if room_name is not None:
            queryset = queryset.filter(room__name=room_name)
        return queryset

class RabbitMQConnectionViewSet(viewsets.ModelViewSet):
    queryset = RabbitMQConnection.objects.all()
    serializer_class = RabbitMQConnectionSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def test_connection(self, request):
        try:
            rabbitmq_service = get_rabbitmq_service()
            success = rabbitmq_service.test_connection()
            return Response({
                'status': 'connected' if success else 'disconnected',
                'message': 'Conexão testada com sucesso' if success else 'Erro na conexão'
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def status(self, request):
        try:
            rabbitmq_service = get_rabbitmq_service()
            success = rabbitmq_service.test_connection()
            return Response({
                'status': 'connected' if success else 'disconnected'
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def send_message(request):
    serializer = SendMessageSerializer(data=request.data)
    
    if serializer.is_valid():
        room_name = serializer.validated_data['room_name']
        sender_id = serializer.validated_data['sender_id']
        content = serializer.validated_data['content']
        message_type = serializer.validated_data['message_type']
        
        try:
            sender = User.objects.get(id=sender_id, is_active=True)
            room, created = ChatRoom.objects.get_or_create(name=room_name)
            
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
                return Response({
                    'message': 'Mensagem enviada com sucesso',
                    'data': MessageSerializer(message).data
                }, status=status.HTTP_201_CREATED)
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

@api_view(['GET'])
def get_rooms(request):
    rooms = ChatRoom.objects.all()
    serializer = ChatRoomSerializer(rooms, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_messages(request, room_name):
    try:
        from urllib.parse import unquote
        room_name = unquote(room_name)
        
        room = ChatRoom.objects.get(name=room_name)
        messages = room.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    except ChatRoom.DoesNotExist:
        return Response([], status=status.HTTP_200_OK)

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

@api_view(['POST'])
def kong_test(request):
    return Response({
        'message': 'Teste de integração com Kong bem-sucedido',
        'gateway': 'Kong',
        'service': 'Chat-API',
        'method': request.method,
        'path': request.path,
        'headers': dict(request.headers),
        'timestamp': timezone.now().isoformat()
    })



