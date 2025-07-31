from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import NotificationViewSet

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'rooms', views.ChatRoomViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/users/register/', views.register_user, name='register'),
    path('api/users/login/', views.login_user, name='login'),
    path('api/messages/<str:room_name>/', views.get_messages, name='get_messages'),
    path('api/send-message/', views.send_message, name='send_message'),
    path('api/rabbitmq/status/', views.rabbitmq_status, name='rabbitmq_status'),
    path('api/files/<str:file_id>/', views.download_file, name='download_file'),
    path('api/kong/status/', views.kong_status, name='kong_status'),
]
