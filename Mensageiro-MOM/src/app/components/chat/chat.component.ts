import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Message, ChatRoom, SendMessageRequest, User } from '../../services/chat.service';
import { KongStatusComponent } from '../kong-status/kong-status.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, KongStatusComponent],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h1>Mensageiro MOM</h1>
        <div class="user-info">
          <span class="username">{{ currentUser?.username }}</span>
          <button (click)="logout()" class="logout-btn">Sair</button>
        </div>
        <div class="connection-status">
          <span [class]="connectionStatus" class="status-indicator"></span>
          {{ connectionStatusText }}
        </div>
      </div>

      <div class="room-selection">
        <div class="room-input">
          <input 
            [(ngModel)]="newRoomName" 
            placeholder="Nome da sala"
            (keyup.enter)="createRoom()"
          >
          <button (click)="createRoom()" [disabled]="!newRoomName.trim()">
            Criar Sala
          </button>
        </div>
        
        <div class="room-list">
          <h3>Salas Disponíveis:</h3>
          <div class="room-item" 
               *ngFor="let room of rooms" 
               [class.active]="currentRoom?.name === room.name"
               (click)="selectRoom(room)">
            <span class="room-name">{{ room.name }}</span>
            <span class="message-count">{{ room.message_count }} mensagens</span>
          </div>
        </div>
      </div>

      <div class="chat-area" *ngIf="currentRoom">
        <div class="chat-messages" #messagesContainer>
          <div class="message" 
               *ngFor="let message of messages" 
               [class.system]="message.message_type === 'system'"
               [class.own]="message.sender_username === currentUser?.username">
            <div class="message-header">
              <span class="sender">{{ message.sender_username }}</span>
              <span class="timestamp">{{ formatTimestamp(message.timestamp) }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>

        <div class="message-input">
          <div class="message-form">
            <input 
              [(ngModel)]="newMessage" 
              placeholder="Digite sua mensagem..."
              (keyup.enter)="sendMessage()"
            >
            <button (click)="sendMessage()" 
                    [disabled]="!newMessage.trim()">
              Enviar
            </button>
          </div>
        </div>
      </div>

      <div class="no-room" *ngIf="!currentRoom">
        <p>Selecione uma sala para começar a conversar!</p>
      </div>

      <app-kong-status></app-kong-status>
    </div>
  `,
  styles: [`
    .chat-container {
      max-width: 800px;
      margin: 0 auto;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }

    .chat-header {
      background: #2c3e50;
      color: white;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .username {
      font-weight: bold;
      color: #3498db;
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .logout-btn:hover {
      background: #c0392b;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .status-indicator.connected {
      background: #27ae60;
    }

    .status-indicator.disconnected {
      background: #e74c3c;
    }

    .room-selection {
      background: white;
      padding: 1rem;
      border-bottom: 1px solid #ddd;
    }

    .room-input {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .room-input input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .room-input button {
      padding: 0.5rem 1rem;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .room-input button:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .room-list h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .room-item {
      padding: 0.5rem;
      border: 1px solid #ddd;
      margin-bottom: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .room-item:hover {
      background: #f8f9fa;
    }

    .room-item.active {
      background: #3498db;
      color: white;
    }

    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .chat-messages {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      max-height: 400px;
    }

    .message {
      margin-bottom: 1rem;
      padding: 0.5rem;
      border-radius: 8px;
      background: #f8f9fa;
      border-left: 4px solid #3498db;
    }

    .message.system {
      background: #fff3cd;
      border-left-color: #ffc107;
    }

    .message.own {
      background: #d4edda;
      border-left-color: #28a745;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .sender {
      font-weight: bold;
      color: #2c3e50;
    }

    .timestamp {
      color: #6c757d;
    }

    .message-content {
      color: #495057;
    }

    .message-input {
      padding: 1rem;
      border-top: 1px solid #ddd;
      background: #f8f9fa;
    }

    .message-form {
      display: flex;
      gap: 0.5rem;
    }

    .message-form input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .message-form button {
      padding: 0.5rem 1rem;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .message-form button:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .no-room {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      color: #6c757d;
      font-size: 1.2rem;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  rooms: ChatRoom[] = [];
  currentRoom: ChatRoom | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  newRoomName: string = '';
  connectionStatus: 'connected' | 'disconnected' = 'disconnected';
  connectionStatusText: string = 'Desconectado';
  currentUser: User | null = null;
  
  private subscription = new Subscription();
  private pollInterval = interval(2000);

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.currentUser = this.chatService.getCurrentUser();
    this.loadRooms();
    this.checkConnection();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  logout(): void {
    this.chatService.logout();
  }

  loadRooms(): void {
    this.subscription.add(
      this.chatService.getRooms().subscribe({
        next: (rooms) => {
          this.rooms = rooms;
        },
        error: (error) => {
          console.error('Erro ao carregar salas:', error);
        }
      })
    );
  }

  selectRoom(room: ChatRoom): void {
    this.currentRoom = room;
    this.loadMessages(room.name);
  }

  loadMessages(roomName: string): void {
    this.subscription.add(
      this.chatService.getMessages(roomName).subscribe({
        next: (messages) => {
          this.messages = messages;
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Erro ao carregar mensagens:', error);
        }
      })
    );
  }

  createRoom(): void {
    if (!this.newRoomName.trim()) return;

    this.subscription.add(
      this.chatService.createRoom(this.newRoomName).subscribe({
        next: (room) => {
          this.rooms.push(room);
          this.newRoomName = '';
          this.selectRoom(room);
        },
        error: (error) => {
          console.error('Erro ao criar sala:', error);
        }
      })
    );
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.currentRoom || !this.currentUser) return;

    const request: SendMessageRequest = {
      room_name: this.currentRoom.name,
      sender_id: this.currentUser.id,
      content: this.newMessage,
      message_type: 'text'
    };

    this.subscription.add(
      this.chatService.sendMessage(request).subscribe({
        next: (response) => {
          this.newMessage = '';
          this.loadMessages(this.currentRoom!.name);
        },
        error: (error) => {
          console.error('Erro ao enviar mensagem:', error);
        }
      })
    );
  }

  checkConnection(): void {
    this.subscription.add(
      this.chatService.getRabbitMQStatus().subscribe({
        next: (response) => {
          this.connectionStatus = response.status === 'connected' ? 'connected' : 'disconnected';
          this.connectionStatusText = response.status === 'connected' ? 'Conectado' : 'Desconectado';
        },
        error: (error) => {
          this.connectionStatus = 'disconnected';
          this.connectionStatusText = 'Erro de Conexão';
          console.error('Erro ao verificar conexão:', error);
        }
      })
    );
  }

  startPolling(): void {
    this.subscription.add(
      this.pollInterval.subscribe(() => {
        if (this.currentRoom) {
          this.loadMessages(this.currentRoom.name);
        }
        this.checkConnection();
      })
    );
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }
} 