from django.contrib import admin
from .models import ChatRoom, Message, RabbitMQConnection, User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'created_at', 'last_login', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['username', 'email']
    readonly_fields = ['id', 'created_at', 'last_login']

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at', 'updated_at', 'message_count']
    search_fields = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Mensagens'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender_username', 'room_name', 'content_preview', 'timestamp', 'message_type']
    list_filter = ['message_type', 'timestamp', 'room']
    search_fields = ['content', 'sender__username', 'room__name']
    readonly_fields = ['id', 'timestamp']

    def sender_username(self, obj):
        return obj.sender.username
    sender_username.short_description = 'Remetente'

    def room_name(self, obj):
        return obj.room.name
    room_name.short_description = 'Sala'

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Conteúdo'

@admin.register(RabbitMQConnection)
class RabbitMQConnectionAdmin(admin.ModelAdmin):
    list_display = ['host', 'port', 'username', 'virtual_host', 'created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
