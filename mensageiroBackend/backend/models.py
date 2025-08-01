from django.db import models
from django.utils import timezone
import uuid

class User(models.Model):
    """Modelo para usuários do sistema"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=128)  # Em produção, usar hash
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return self.username

class ChatRoom(models.Model):
    """Modelo para salas de chat"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_rooms'
        verbose_name = 'Sala de Chat'
        verbose_name_plural = 'Salas de Chat'

    def __str__(self):
        return self.name

class Message(models.Model):
    """Modelo para mensagens do chat"""
    MESSAGE_TYPES = [
        ('text', 'Texto'),
        ('system', 'Sistema'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')

    class Meta:
        db_table = 'messages'
        verbose_name = 'Mensagem'
        verbose_name_plural = 'Mensagens'
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

class RabbitMQConnection(models.Model):
    """Modelo para configurações do RabbitMQ"""
    host = models.CharField(max_length=255, default='localhost')
    port = models.IntegerField(default=5672)
    username = models.CharField(max_length=100, default='guest')
    password = models.CharField(max_length=100, default='guest')
    virtual_host = models.CharField(max_length=100, default='/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rabbitmq_connections'
        verbose_name = 'Conexão RabbitMQ'
        verbose_name_plural = 'Conexões RabbitMQ'

    def __str__(self):
        return f"{self.host}:{self.port}"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('message', 'Nova Mensagem'),
        ('file_upload', 'Arquivo Enviado'),
        ('user_join', 'Usuário Entrou'),
        ('user_leave', 'Usuário Saiu'),
        ('system', 'Sistema'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Baixa'),
        ('medium', 'Média'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(default=dict, blank=True)  # Dados extras
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'notifications'
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"