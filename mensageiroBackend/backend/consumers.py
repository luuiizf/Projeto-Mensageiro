import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .rabbitmq_service import rabbitmq_service


class ChatConsumer(AsyncWebsocketConsumer):
    """Consumer WebSocket para chat em tempo real"""
    
    async def connect(self):
        """Conecta ao WebSocket"""
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Junta-se ao grupo da sala
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """Desconecta do WebSocket"""
        # Sai do grupo da sala
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Recebe mensagem do WebSocket"""
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        sender = text_data_json['sender']

        # Envia mensagem para o grupo da sala
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender
            }
        )

    async def chat_message(self, event):
        """Envia mensagem para o WebSocket"""
        message = event['message']
        sender = event['sender']

        # Envia mensagem para o WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender
        })) 