from rest_framework import serializers
from .models import ChatRoom, Message, RabbitMQConnection, User, Notification
import hashlib

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'created_at', 'last_login', 'is_active']
        read_only_fields = ['id', 'created_at', 'last_login']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'password', 'password_confirm', 'email']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("As senhas não coincidem.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data['password'] = hashlib.sha256(validated_data['password'].encode()).hexdigest()
        return User.objects.create(**validated_data)

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            try:
                user = User.objects.get(username=username, password=hashed_password, is_active=True)
                data['user'] = user
                return data
            except User.DoesNotExist:
                raise serializers.ValidationError("Credenciais inválidas.")
        else:
            raise serializers.ValidationError("Username e password são obrigatórios.")

class ChatRoomSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'created_at', 'updated_at', 'message_count']

    def get_message_count(self, obj):
        return obj.messages.count()

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'room_name', 'sender', 'sender_username', 'content', 'timestamp', 'message_type']
        read_only_fields = ['id', 'timestamp']

class SendMessageSerializer(serializers.Serializer):
    room_name = serializers.CharField()
    sender_id = serializers.UUIDField()
    content = serializers.CharField()
    message_type = serializers.ChoiceField(choices=[('text', 'text'), ('system', 'system')], default='text')

    def validate_sender_id(self, value):
        try:
            User.objects.get(id=value, is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Usuário não encontrado ou inativo.")

class RabbitMQConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RabbitMQConnection
        fields = '__all__' 

class NotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_username', 'room', 'room_name',
            'notification_type', 'title', 'message', 'priority',
            'is_read', 'created_at', 'data'
        ]
        read_only_fields = ['id', 'created_at']

class CreateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'user', 'room', 'notification_type', 'title', 
            'message', 'priority', 'data'
        ]
    
    def validate_user(self, value):
        if not value.is_active:
            raise serializers.ValidationError("Usuário deve estar ativo.")
        return value
