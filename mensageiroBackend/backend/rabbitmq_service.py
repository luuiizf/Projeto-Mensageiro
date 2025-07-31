import pika
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class RabbitMQService:
    def __init__(self):
        self.connection = None
        self.channel = None
    
    def connect(self):
        try:
            credentials = pika.PlainCredentials(
                settings.RABBITMQ_USER,
                settings.RABBITMQ_PASS
            )
            
            parameters = pika.ConnectionParameters(
                host=settings.RABBITMQ_HOST,
                port=settings.RABBITMQ_PORT,
                virtual_host=settings.RABBITMQ_VHOST,
                credentials=credentials
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            self.channel.queue_declare(queue='chat_messages', durable=True)
            self.channel.queue_declare(queue='system_messages', durable=True)
            
            self.channel.exchange_declare(
                exchange='chat_exchange',
                exchange_type='fanout',
                durable=True
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao conectar com RabbitMQ: {e}")
            return False
    
    def test_connection(self):
        try:
            if not self.connection or self.connection.is_closed:
                return self.connect()
            return True
        except Exception as e:
            logger.error(f"Erro ao testar conexão: {e}")
            return False
    
    def publish_message(self, message_data):
        try:
            if not self.connection or self.connection.is_closed:
                if not self.connect():
                    return False
            
            message_body = json.dumps(message_data)
            room_queue = f"chat_room_{message_data['room_name']}"
            self.channel.queue_declare(queue=room_queue, durable=True)
            
            self.channel.basic_publish(
                exchange='',
                routing_key=room_queue,
                body=message_body,
                properties=pika.BasicProperties(delivery_mode=2)
            )
            
            self.channel.basic_publish(
                exchange='chat_exchange',
                routing_key='',
                body=message_body,
                properties=pika.BasicProperties(delivery_mode=2)
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao publicar mensagem: {e}")
            return False
    
    def close_connection(self):
        try:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
        except Exception as e:
            logger.error(f"Erro ao fechar conexão: {e}")


def get_rabbitmq_service():
    return RabbitMQService() 