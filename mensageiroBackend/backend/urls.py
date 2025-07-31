from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'rooms', views.ChatRoomViewSet)
router.register(r'rabbitmq', views.RabbitMQConnectionViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/send-message/', views.send_message, name='send_message'),
    path('api/rooms/', views.get_rooms, name='get_rooms'),
    path('api/messages/<str:room_name>/', views.get_messages, name='get_messages'),
    path('api/kong/status/', views.kong_status, name='kong_status'),
    path('api/kong/test/', views.kong_test, name='kong_test'),
] 