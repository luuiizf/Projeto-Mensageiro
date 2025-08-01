import os
import sys
import django
from django.conf import settings

# Configurar Django primeiro
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mensageiroBackend.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from flask import Flask, request, Response
import xml.etree.ElementTree as ET
import uuid
import json
import pika
from datetime import datetime
import base64
from backend.models import User, ChatRoom, Message, Notification
from backend.rabbitmq_service import get_rabbitmq_service

app = Flask(__name__)

# Adicionar CORS headers a todas as respostas
@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, SOAPAction, Authorization'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

# Diretório para uploads
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

def create_soap_envelope(body_content):
    """Cria envelope SOAP"""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://mensageiro.soap.service">
    <soap:Body>
        {body_content}
    </soap:Body>
</soap:Envelope>"""

def create_wsdl():
    """Gera WSDL do serviço"""
    return """<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:tns="http://mensageiro.soap.service"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema"
             targetNamespace="http://mensageiro.soap.service">

    <types>
        <xsd:schema targetNamespace="http://mensageiro.soap.service">
            <xsd:complexType name="FileInfo">
                <xsd:sequence>
                    <xsd:element name="file_id" type="xsd:string"/>
                    <xsd:element name="filename" type="xsd:string"/>
                    <xsd:element name="file_size" type="xsd:string"/>
                    <xsd:element name="upload_date" type="xsd:dateTime"/>
                    <xsd:element name="uploader_username" type="xsd:string"/>
                    <xsd:element name="room_name" type="xsd:string"/>
                </xsd:sequence>
            </xsd:complexType>
            
            <xsd:complexType name="FileUploadResponse">
                <xsd:sequence>
                    <xsd:element name="success" type="xsd:boolean"/>
                    <xsd:element name="message" type="xsd:string"/>
                    <xsd:element name="file_info" type="tns:FileInfo" minOccurs="0"/>
                </xsd:sequence>
            </xsd:complexType>
        </xsd:schema>
    </types>

    <message name="uploadFileRequest">
        <part name="username" type="xsd:string"/>
        <part name="room_name" type="xsd:string"/>
        <part name="filename" type="xsd:string"/>
        <part name="file_data" type="xsd:base64Binary"/>
        <part name="description" type="xsd:string"/>
    </message>
    
    <message name="uploadFileResponse">
        <part name="response" type="tns:FileUploadResponse"/>
    </message>
    
    <message name="downloadFileRequest">
        <part name="file_id" type="xsd:string"/>
    </message>
    
    <message name="downloadFileResponse">
        <part name="file_data" type="xsd:base64Binary"/>
    </message>
    
    <message name="listFilesRequest">
        <part name="room_name" type="xsd:string"/>
    </message>
    
    <message name="listFilesResponse">
        <part name="files" type="tns:FileInfo" maxOccurs="unbounded"/>
    </message>

    <portType name="FileServicePortType">
        <operation name="upload_file">
            <input message="tns:uploadFileRequest"/>
            <output message="tns:uploadFileResponse"/>
        </operation>
        <operation name="download_file">
            <input message="tns:downloadFileRequest"/>
            <output message="tns:downloadFileResponse"/>
        </operation>
        <operation name="list_files">
            <input message="tns:listFilesRequest"/>
            <output message="tns:listFilesResponse"/>
        </operation>
    </portType>

    <binding name="FileServiceBinding" type="tns:FileServicePortType">
        <soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/>
        <operation name="upload_file">
            <soap:operation soapAction="upload_file"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        <operation name="download_file">
            <soap:operation soapAction="download_file"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
        <operation name="list_files">
            <soap:operation soapAction="list_files"/>
            <input><soap:body use="literal"/></input>
            <output><soap:body use="literal"/></output>
        </operation>
    </binding>

    <service name="FileService">
        <port name="FileServicePort" binding="tns:FileServiceBinding">
            <soap:address location="http://localhost:8001/soap"/>
        </port>
    </service>
</definitions>"""

@app.route('/', methods=['GET'])
def wsdl():
    """Retorna WSDL"""
    if request.args.get('wsdl') is not None:
        return Response(create_wsdl(), mimetype='text/xml')
    return "Serviço SOAP ativo. Acesse ?wsdl para ver o WSDL"

@app.route('/soap', methods=['OPTIONS'])
def soap_options():
    """Handle CORS preflight for SOAP endpoint"""
    return '', 200

@app.route('/soap', methods=['POST'])
def soap_service():
    """Processa requisições SOAP"""
    try:
        print("=== DEBUG: Recebeu requisição SOAP ===")
        print(f"DEBUG: Content-Type: {request.content_type}")
        print(f"DEBUG: Tamanho dos dados: {len(request.data) if request.data else 0}")
        
        # Parse do XML SOAP
        root = ET.fromstring(request.data)
        print("DEBUG: XML parseado com sucesso")
        
        # Encontrar a operação
        body = root.find('.//{http://schemas.xmlsoap.org/soap/envelope/}Body')
        if body is None:
            print("DEBUG: Body SOAP não encontrado")
            return create_error_response("Body SOAP não encontrado")
        
        print("DEBUG: Body SOAP encontrado")
        
        # Verificar qual operação foi chamada
        for child in body:
            operation = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            print(f"DEBUG: Operação encontrada: {operation}")
            
            if operation == 'upload_file':
                print("DEBUG: Chamando handle_upload_file")
                return handle_upload_file(child)
            elif operation == 'download_file':
                print("DEBUG: Chamando handle_download_file")
                return handle_download_file(child)
            elif operation == 'list_files':
                print("DEBUG: Chamando handle_list_files")
                return handle_list_files(child)
        
        return create_error_response("Operação não reconhecida")
        
    except ET.ParseError as e:
        print(f"DEBUG: Erro de parse XML: {e}")
        return create_error_response(f"Erro ao parsear XML: {str(e)}")
    except Exception as e:
        print(f"DEBUG: Erro geral: {e}")
        import traceback
        traceback.print_exc()
        return create_error_response(f"Erro interno: {str(e)}")

def handle_upload_file(element):
    """Processa upload de arquivo"""
    try:
        print("=== DEBUG: Iniciando handle_upload_file ===")
        
        # Extrair parâmetros
        username = get_element_text(element, 'username') or 'guest'
        room_name = get_element_text(element, 'room_name') or 'default'
        filename = get_element_text(element, 'filename')
        file_data_b64 = get_element_text(element, 'file_data')
        description = get_element_text(element, 'description', '')
        
        print(f"DEBUG: Parâmetros - username: {username}, room_name: {room_name}, filename: {filename}")
        
        if not filename:
            print("DEBUG: Erro - filename ausente")
            return create_error_response("Filename é obrigatório")
        
        if not file_data_b64:
            print("DEBUG: Erro - file_data ausente")
            return create_error_response("File_data é obrigatório")
        
        try:
            # Decodificar dados do arquivo
            file_data = base64.b64decode(file_data_b64)
            print(f"DEBUG: Arquivo decodificado, tamanho: {len(file_data)} bytes")
        except Exception as e:
            print(f"DEBUG: Erro ao decodificar base64: {e}")
            return create_error_response(f"Erro ao decodificar arquivo: {str(e)}")
        
        # Gerar ID único para o arquivo
        file_id = str(uuid.uuid4())
        
        # Salvar arquivo
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{filename}")
        print(f"DEBUG: Salvando arquivo em: {file_path}")
        
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Buscar ou criar usuário e sala
        try:
            user, created = User.objects.get_or_create(username=username)
            room, created = ChatRoom.objects.get_or_create(name=room_name)
            print(f"DEBUG: Usuário: {user.username}, Sala: {room.name}")
        except Exception as e:
            print(f"DEBUG: Erro ao buscar/criar usuário/sala: {e}")
            # Continuar mesmo se der erro no banco
        
        # Criar mensagem no chat
        try:
            message_content = f"📎 Arquivo compartilhado: {filename}"
            if description:
                message_content += f" - {description}"
            
            message = Message.objects.create(
                room=room,
                sender=user,
                content=message_content,
                message_type='system'
            )
            print(f"DEBUG: Mensagem criada: {message.id}")
            
            # Publicar no RabbitMQ
            message_data = {
                'id': str(message.id),
                'room_name': room.name,
                'sender_username': user.username,
                'content': message.content,
                'timestamp': message.timestamp.isoformat(),
                'message_type': 'system',
                'file_info': {
                    'file_id': file_id,
                    'filename': filename,
                    'file_size': str(len(file_data)),
                    'file_path': file_path
                }
            }
            
            rabbitmq_service = get_rabbitmq_service()
            rabbitmq_service.publish_message(message_data)
            print("DEBUG: Mensagem publicada no RabbitMQ")
            
            # Criar notificações para outros usuários na sala
            try:
                other_users = User.objects.exclude(id=user.id)
                for other_user in other_users:
                    Notification.objects.create(
                        user=other_user,
                        room=room,
                        notification_type='file_upload',
                        title=f'Arquivo compartilhado em #{room.name}',
                        message=f'{user.username} compartilhou: {filename}',
                        priority='medium',
                        data={
                            'file_id': file_id,
                            'filename': filename,
                            'file_size': str(len(file_data)),
                            'uploader_id': str(user.id),
                            'uploader_username': user.username
                        }
                    )
                print(f"DEBUG: Criadas {other_users.count()} notificações de arquivo")
            except Exception as notif_error:
                print(f"DEBUG: Erro ao criar notificações: {notif_error}")
            
        except Exception as e:
            print(f"DEBUG: Erro ao criar mensagem/publicar RabbitMQ: {e}")
            # Continuar mesmo se der erro
        
        # Criar resposta SOAP
        response_body = f"""<upload_file_response>
            <success>true</success>
            <message>Arquivo enviado com sucesso</message>
            <file_id>{file_id}</file_id>
            <filename>{filename}</filename>
            <file_size>{len(file_data)}</file_size>
            <upload_date>{datetime.now().isoformat()}</upload_date>
            <uploader_username>{username}</uploader_username>
            <room_name>{room_name}</room_name>
        </upload_file_response>"""
        
        print("DEBUG: Criando resposta de sucesso")
        response_xml = create_soap_envelope(response_body)
        print(f"DEBUG: XML de resposta: {response_xml[:200]}...")
        return Response(response_xml, mimetype='text/xml')
        
    except Exception as e:
        print(f"DEBUG: Erro geral na função: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_error_response(f"Erro interno no upload: {str(e)}")

def handle_download_file(element):
    """Processa download de arquivo"""
    try:
        print("=== DEBUG: Iniciando handle_download_file ===")
        file_id = get_element_text(element, 'file_id')
        
        print(f"DEBUG: Procurando arquivo com ID: {file_id}")
        
        if not file_id:
            print("DEBUG: Erro - file_id ausente")
            return create_error_response("ID do arquivo é obrigatório")
        
        # Procurar arquivo
        for filename in os.listdir(UPLOAD_DIR):
            if filename.startswith(file_id):
                file_path = os.path.join(UPLOAD_DIR, filename)
                print(f"DEBUG: Arquivo encontrado: {file_path}")
                
                # Extrair nome original
                original_filename = filename.split('_', 1)[1] if '_' in filename else filename
                
                with open(file_path, 'rb') as f:
                    file_data = f.read()
                
                print(f"DEBUG: Arquivo lido, tamanho: {len(file_data)} bytes")
                
                file_data_b64 = base64.b64encode(file_data).decode('utf-8')
                print(f"DEBUG: Arquivo codificado em base64, tamanho: {len(file_data_b64)} chars")
                
                response_body = f"""<download_file_response>
                    <success>true</success>
                    <message>Arquivo baixado com sucesso</message>
                    <file_id>{file_id}</file_id>
                    <filename>{original_filename}</filename>
                    <file_size>{len(file_data)}</file_size>
                    <file_data>{file_data_b64}</file_data>
                </download_file_response>"""
                
                print("DEBUG: Criando resposta de download")
                response_xml = create_soap_envelope(response_body)
                return Response(response_xml, mimetype='text/xml')
        
        print("DEBUG: Arquivo não encontrado")
        return create_error_response("Arquivo não encontrado")
        
    except Exception as e:
        print(f"DEBUG: Erro no download: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_error_response(f"Erro no download: {str(e)}")

def handle_list_files(element):
    """Lista arquivos de uma sala ou todos os arquivos"""
    try:
        print("=== DEBUG: Iniciando handle_list_files ===")
        room_name = get_element_text(element, 'room_name', '')
        
        print(f"DEBUG: Listando arquivos para sala: {room_name if room_name else 'todas'}")
        
        files_xml = ""
        file_count = 0
        
        try:
            for filename in os.listdir(UPLOAD_DIR):
                if '_' in filename:
                    file_id, original_name = filename.split('_', 1)
                    file_path = os.path.join(UPLOAD_DIR, filename)
                    file_stat = os.stat(file_path)
                    
                    # Se room_name foi especificado, buscar no banco para filtrar
                    # Por simplicidade, vamos retornar todos os arquivos por enquanto
                    
                    files_xml += f"""
                    <file>
                        <file_id>{file_id}</file_id>
                        <filename>{original_name}</filename>
                        <file_size>{file_stat.st_size}</file_size>
                        <upload_date>{datetime.fromtimestamp(file_stat.st_mtime).isoformat()}</upload_date>
                        <room_name>{room_name or 'unknown'}</room_name>
                    </file>"""
                    file_count += 1
        except Exception as e:
            print(f"DEBUG: Erro ao listar diretório: {e}")
            files_xml = ""
        
        print(f"DEBUG: Encontrados {file_count} arquivos")
        
        response_body = f"""<list_files_response>
            <success>true</success>
            <message>Arquivos listados com sucesso</message>
            <file_count>{file_count}</file_count>
            <files>
                {files_xml}
            </files>
        </list_files_response>"""
        
        print("DEBUG: Criando resposta de listagem")
        response_xml = create_soap_envelope(response_body)
        return Response(response_xml, mimetype='text/xml')
        
    except Exception as e:
        print(f"DEBUG: Erro geral na listagem: {e}")
        import traceback
        traceback.print_exc()
        return create_error_response(f"Erro ao listar arquivos: {str(e)}")

def get_element_text(parent, tag_name, default=None):
    """Extrai texto de um elemento XML"""
    for child in parent:
        local_name = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if local_name == tag_name:
            return child.text
    return default

def create_error_response(error_message):
    """Cria resposta de erro SOAP"""
    fault_body = f"""
    <soap:Fault>
        <faultcode>Server</faultcode>
        <faultstring>{error_message}</faultstring>
    </soap:Fault>"""
    
    return Response(create_soap_envelope(fault_body), mimetype='text/xml', status=500)

if __name__ == '__main__':
    print("🚀 Servidor SOAP iniciando...")
    print("📍 URL: http://localhost:8001")
    print("📋 WSDL: http://localhost:8001?wsdl")
    print("🔧 Endpoint SOAP: http://localhost:8001/soap")
    app.run(host='localhost', port=8001, debug=True)
