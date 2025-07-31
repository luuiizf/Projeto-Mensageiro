from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)


class KongMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.META['HTTP_X_GATEWAY'] = 'Kong'
        request.META['HTTP_X_SERVICE'] = 'Chat-API'
        request.META['HTTP_X_REQUEST_ID'] = request.META.get('HTTP_X_REQUEST_ID', 'generated-id-123')
        logger.info(f"KongMiddleware: Request to {request.path} from {request.META.get('REMOTE_ADDR')}")
        return None

    def process_response(self, request, response):
        response['X-Gateway'] = 'Kong'
        response['X-Service'] = 'Chat-API'
        response['X-Request-ID'] = request.META.get('HTTP_X_REQUEST_ID', 'generated-id-123')
        return response

    def process_exception(self, request, exception):
        logger.error(f"Erro na requisição: {exception}")
        
        return JsonResponse({
            'error': 'Erro interno do servidor',
            'message': str(exception),
            'gateway': 'Kong'
        }, status=500)


class RateLimitMiddleware(MiddlewareMixin):
    def __init__(self, get_response):
        super().__init__(get_response)
        self.request_counts = {}
    
    def process_request(self, request):
        return None
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 