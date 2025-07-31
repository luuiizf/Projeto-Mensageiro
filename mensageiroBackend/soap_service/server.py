import os
import sys
import django
from django.conf import settings

# Configurar Django primeiro
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mensageiroBackend.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from flask import Flask, request, Response
from flask_cors import CORS
import xml.etree.ElementTree as ET
import uuid
import json
import pika
from datetime import datetime
import base64
from backend.models import User, ChatRoom, Message
from backend.rabbitmq_service import get_rabbitmq_service

app = Flask(__name__)

# Configurar CORS
CORS(app, origins=['http://localhost:4200', 'http://localhost:8000'], 
     allow_headers=['Content-Type', 'SOAPAction', 'Authorization'],
     methods=['GET', 'POST', 'OPTIONS'])

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
    response = Response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, SOAPAction, Authorization'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

@app.route('/soap', methods=['POST'])
def soap_service():
    """Processa requisições SOAP"""
    try:
        # Parse do XML SOAP
        root = ET.fromstring(request.data)
        
        # Encontrar a operação
        body = root.find('.//{http://schemas.xmlsoap.org/soap/envelope/}Body')
        if body is None:
            return create_error_response("Body SOAP não encontrado")
        
        # Verificar qual operação foi chamada
        for child in body:
            operation = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            
            if operation == 'upload_file':
                return handle_upload_file(child)
            elif operation == 'download_file':
                return handle_download_file(child)
            elif operation == 'list_files':
                return handle_list_files(child)
        
        return create_error_response("Operação não reconhecida")
        
    except ET.ParseError as e:
        return create_error_response(f"Erro ao parsear XML: {str(e)}")
    except Exception as e:
        return create_error_response(f"Erro interno: {str(e)}")

def handle_upload_file(element):
    """Processa upload de arquivo"""
    try:
        # Extrair parâmetros
        username = get_element_text(element, 'username') or 'guest'
        room_name = get_element_text(element, 'room_name') or 'default'
        filename = get_element_text(element, 'filename')
        file_data_b64 = get_element_text(element, 'file_data')
        description = get_element_text(element, 'description', 'Uploaded via SOAP')
        
        if not all([filename, file_data_b64]):
            return create_error_response("Filename e file_data são obrigatórios")
        
        # Decodificar arquivo
        try:
            file_data = base64.b64decode(file_data_b64)
        except Exception as e:
            return create_error_response(f"Erro ao decodificar arquivo: {str(e)}")
        
        # Verificar usuário ou criar se não existir (sem depender do Django por enquanto)
        file_id = str(uuid.uuid4())
        
        # Gerar nome seguro para arquivo
        file_extension = os.path.splitext(filename)[1]
        safe_filename = f"{file_id}_{filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        # Salvar arquivo
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Criar resposta de sucesso
        response_body = f"""
        <tns:upload_file_response>
            <tns:success>true</tns:success>
            <tns:message>Arquivo enviado com sucesso</tns:message>
            <tns:file_info>
                <tns:file_id>{file_id}</tns:file_id>
                <tns:filename>{filename}</tns:filename>
                <tns:file_size>{len(file_data)}</tns:file_size>
                <tns:upload_date>{datetime.now().isoformat()}</tns:upload_date>
                <tns:uploader_username>{username}</tns:uploader_username>
                <tns:room_name>{room_name}</tns:room_name>
                <tns:file_url>/api/files/{file_id}/</tns:file_url>
            </tns:file_info>
        </tns:upload_file_response>"""
        
        return Response(create_soap_envelope(response_body), mimetype='text/xml')
        
    except Exception as e:
        return create_error_response(f"Erro interno no upload: {str(e)}")
        
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Criar mensagem no chat
        message_content = f"📎 Arquivo compartilhado: {filename}"
        if description:
            message_content += f" - {description}"
        
        message = Message.objects.create(
            room=room,
            sender=user,
            content=message_content,
            message_type='system'
        )
        
        # Publicar no RabbitMQ
        try:
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
        except Exception as e:
            print(f"Erro ao publicar no RabbitMQ: {e}")
        
        # Criar resposta SOAP
        response_body = f"""
        <tns:upload_fileResponse xmlns:tns="http://mensageiro.soap.service">
            <tns:response>
                <tns:success>true</tns:success>
                <tns:message>Arquivo enviado com sucesso</tns:message>
                <tns:file_info>
                    <tns:file_id>{file_id}</tns:file_id>
                    <tns:filename>{filename}</tns:filename>
                    <tns:file_size>{len(file_data)}</tns:file_size>
                    <tns:upload_date>{datetime.now().isoformat()}</tns:upload_date>
                    <tns:uploader_username>{username}</tns:uploader_username>
                    <tns:room_name>{room_name}</tns:room_name>
                </tns:file_info>
            </tns:response>
        </tns:upload_fileResponse>"""
        
        return Response(create_soap_envelope(response_body), mimetype='text/xml')
        
    except Exception as e:
        return create_error_response(f"Erro no upload: {str(e)}")

def handle_download_file(element):
    """Processa download de arquivo"""
    try:
        file_id = get_element_text(element, 'file_id')
        
        if not file_id:
            return create_error_response("ID do arquivo é obrigatório")
        
        # Procurar arquivo
        for filename in os.listdir(UPLOAD_DIR):
            if filename.startswith(file_id):
                file_path = os.path.join(UPLOAD_DIR, filename)
                with open(file_path, 'rb') as f:
                    file_data = f.read()
                
                file_data_b64 = base64.b64encode(file_data).decode('utf-8')
                
                response_body = f"""
                <tns:download_fileResponse xmlns:tns="http://mensageiro.soap.service">
                    <tns:file_data>{file_data_b64}</tns:file_data>
                </tns:download_fileResponse>"""
                
                return Response(create_soap_envelope(response_body), mimetype='text/xml')
        
        return create_error_response("Arquivo não encontrado")
        
    except Exception as e:
        return create_error_response(f"Erro no download: {str(e)}")

def handle_list_files(element):
    """Lista arquivos de uma sala"""
    try:
        room_name = get_element_text(element, 'room_name')
        
        if not room_name:
            return create_error_response("Nome da sala é obrigatório")
        
        files_xml = ""
        
        for filename in os.listdir(UPLOAD_DIR):
            if '_' in filename:
                file_id, original_name = filename.split('_', 1)
                file_path = os.path.join(UPLOAD_DIR, filename)
                file_stat = os.stat(file_path)
                
                files_xml += f"""
                <tns:files>
                    <tns:file_id>{file_id}</tns:file_id>
                    <tns:filename>{original_name}</tns:filename>
                    <tns:file_size>{file_stat.st_size}</tns:file_size>
                    <tns:upload_date>{datetime.fromtimestamp(file_stat.st_mtime).isoformat()}</tns:upload_date>
                    <tns:room_name>{room_name}</tns:room_name>
                </tns:files>"""
        
        response_body = f"""
        <tns:list_filesResponse xmlns:tns="http://mensageiro.soap.service">
            {files_xml}
        </tns:list_filesResponse>"""
        
        return Response(create_soap_envelope(response_body), mimetype='text/xml')
        
    except Exception as e:
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
