import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { ChatService, type Message, type ChatRoom, type SendMessageRequest, type User, type RoomsResponse, type MessagesResponse } from "../../services/chat.service"
import { KongStatusComponent } from "../kong-status/kong-status.component"
import { FileManagerComponent } from "../file-manager/file-manager.component"
import { NotificationsComponent } from "../notifications/notifications.component"
import { Subscription, interval } from "rxjs"

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [CommonModule, FormsModule, KongStatusComponent, FileManagerComponent, NotificationsComponent],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <div class="header-left">
          <div class="app-logo">
            <div class="logo-icon">💬</div>
            <h1>Mensageiro MOM</h1>
          </div>
        </div>
        <div class="user-info">
          <div class="user-avatar">{{ (currentUser?.username || 'U').charAt(0).toUpperCase() }}</div>
          <span class="username">{{ currentUser?.username }}</span>
          <button (click)="logout()" class="logout-btn">
            <span>Sair</span>
          </button>
        </div>
        <div class="connection-status">
          <span [class]="connectionStatus" class="status-indicator"></span>
          <span class="status-text">{{ connectionStatusText }}</span>
        </div>
      </div>

      <div class="main-content">
        <div class="sidebar">
          <div class="room-section">
            <div class="section-title">
              <span>Salas de Chat</span>
            </div>

            <div class="room-creator">
              <input
                [(ngModel)]="newRoomName"
                placeholder="Digite o nome da sala..."
                (keyup.enter)="createRoom()"
              >
              <button (click)="createRoom()" [disabled]="!newRoomName.trim()" class="create-btn">
                <span>+</span>
              </button>
            </div>

            <div class="room-list">
              <div class="room-item"
                   *ngFor="let room of rooms"
                   [class.active]="currentRoom?.name === room.name"
                   (click)="selectRoom(room)">
                <div class="room-icon">#</div>
                <div class="room-info">
                  <span class="room-name">{{ room.name }}</span>
                  <span class="message-count">{{ room.message_count }} mensagens</span>
                </div>
                <div class="room-indicator" *ngIf="currentRoom?.name === room.name"></div>
              </div>
            </div>
          </div>

          <app-kong-status></app-kong-status>
        </div>

        <div class="chat-area" *ngIf="currentRoom">
          <div class="chat-room-header">
            <div class="room-title">
              <span class="room-hash">#</span>
              <span>{{ currentRoom.name }}</span>
            </div>
            <div class="room-actions">
              <button (click)="toggleFileManager()"
                      [class.active]="showFileManager"
                      class="toggle-btn">
                <span>📁</span>
              </button>
            </div>
          </div>

          <div class="chat-messages" #messagesContainer>
            <div class="message-bubble"
                 *ngFor="let message of messages"
                 [class.system]="message.message_type === 'system'"
                 [class.file]="message.message_type === 'file'"
                 [class.own]="message.sender_username === currentUser?.username">
              <div class="message-avatar" *ngIf="message.sender_username !== currentUser?.username && message.message_type !== 'system'">
                {{ (message.sender_username || 'U').charAt(0).toUpperCase() }}
              </div>
              <div class="message-content">
                <div class="message-header" *ngIf="message.message_type !== 'system'">
                  <span class="sender">{{ message.sender_username }}</span>
                  <span class="timestamp">{{ formatTimestamp(message.timestamp) }}</span>
                </div>
                <div class="message-text">{{ message.content }}</div>
              </div>
            </div>
          </div>

          <div class="message-input-area">
            <div class="input-container">
              <input
                [(ngModel)]="newMessage"
                placeholder="Escrever mensagem para #{{ currentRoom.name }}..."
                (keyup.enter)="sendMessage()"
                class="message-input"
              >
              <button (click)="sendMessage()"
                      [disabled]="!newMessage.trim()"
                      class="send-btn">
                <span>📤</span>
              </button>
            </div>
          </div>

          <!-- File Manager Panel -->
          <div class="file-panel" *ngIf="showFileManager">
            <app-file-manager [currentRoom]="currentRoom"></app-file-manager>
          </div>
        </div>

        <div class="notifications-sidebar">
          <app-notifications></app-notifications>
        </div>

        <div class="no-room-selected" *ngIf="!currentRoom">
          <div class="empty-state">
            <div class="empty-icon">💬</div>
            <h3>Bem-vindo ao Mensageiro MOM!</h3>
            <p>Selecione uma sala para começar a conversar ou crie uma nova sala.</p>
            <div class="features-list">
              <div class="feature-item">
                <span class="feature-icon">💬</span>
                <span>Chat em tempo real</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📁</span>
                <span>Compartilhamento de arquivos</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔔</span>
                <span>Notificações inteligentes</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⚡</span>
                <span>API Gateway Kong</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    * {
      box-sizing: border-box;
    }

    .chat-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .chat-header {
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%);
      color: white;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
      backdrop-filter: blur(10px);
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .app-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      font-size: 1.5rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .chat-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(45deg, #fff, #E0E7FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 25px;
      backdrop-filter: blur(10px);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #06FFA5 0%, #00D4FF 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #1F2937;
      font-size: 0.875rem;
    }

    .username {
      font-weight: 600;
      color: #F3F4F6;
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
    }

    .logout-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-indicator.connected {
      background: #10B981;
      box-shadow: 0 0 10px #10B981;
    }

    .status-indicator.disconnected {
      background: #EF4444;
      box-shadow: 0 0 10px #EF4444;
    }

    .status-text {
      font-size: 0.875rem;
      font-weight: 500;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .main-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .sidebar {
      width: 300px;
      background: linear-gradient(180deg, #374151 0%, #1F2937 100%);
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(139, 92, 246, 0.2);
    }

    .room-section {
      flex: 1;
      padding: 1.5rem;
    }

    .section-title {
      color: #D1D5DB;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }

    .room-creator {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .room-creator input {
      flex: 1;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 12px;
      color: white;
      font-size: 0.875rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .room-creator input:focus {
      outline: none;
      border-color: #8B5CF6;
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
    }

    .room-creator input::placeholder {
      color: #9CA3AF;
    }

    .create-btn {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 1.2rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .create-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
    }

    .create-btn:disabled {
      background: #4B5563;
      cursor: not-allowed;
      transform: none;
    }

    .room-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .room-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid transparent;
    }

    .room-item:hover {
      background: rgba(139, 92, 246, 0.2);
      border-color: rgba(139, 92, 246, 0.3);
      transform: translateX(4px);
    }

    .room-item.active {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%);
      border-color: #8B5CF6;
      transform: translateX(4px);
    }

    .room-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #06FFA5 0%, #00D4FF 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #1F2937;
      font-size: 1.1rem;
    }

    .room-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .room-name {
      color: #F9FAFB;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .message-count {
      color: #9CA3AF;
      font-size: 0.75rem;
    }

    .room-indicator {
      width: 4px;
      height: 20px;
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      border-radius: 2px;
      position: absolute;
      right: -1px;
    }

    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
      position: relative;
    }

    .chat-room-header {
      padding: 1rem 1.5rem;
      background: white;
      border-bottom: 1px solid #E5E7EB;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .room-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1F2937;
    }

    .room-hash {
      color: #8B5CF6;
      font-size: 1.3rem;
    }

    .room-actions {
      display: flex;
      gap: 0.5rem;
    }

    .toggle-btn {
      width: 40px;
      height: 40px;
      background: #F3F4F6;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }

    .toggle-btn:hover, .toggle-btn.active {
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
      border-color: #8B5CF6;
      transform: scale(1.05);
    }

    .chat-messages {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message-bubble {
      display: flex;
      gap: 0.75rem;
      max-width: 80%;
    }

    .message-bubble.own {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-bubble.system {
      align-self: center;
      max-width: 60%;
    }

    .message-bubble.file .message-content {
      background: linear-gradient(135deg, #F59E0B 0%, #EAB308 100%) !important;
      color: white !important;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F59E0B 0%, #EAB308 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .message-content {
      flex: 1;
    }

    .message-bubble.own .message-content {
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
      border-radius: 18px 18px 4px 18px;
      padding: 0.75rem 1rem;
      box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
    }

    .message-bubble:not(.own):not(.system) .message-content {
      background: white;
      color: #1F2937;
      border-radius: 18px 18px 18px 4px;
      padding: 0.75rem 1rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border: 1px solid #E5E7EB;
    }

    .message-bubble.system .message-content {
      background: linear-gradient(135deg, #F59E0B 0%, #EAB308 100%);
      color: white;
      border-radius: 20px;
      padding: 0.5rem 1rem;
      text-align: center;
      font-size: 0.875rem;
      box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3);
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
      font-size: 0.75rem;
    }

    .message-bubble.own .message-header {
      color: rgba(255, 255, 255, 0.8);
    }

    .sender {
      font-weight: 600;
    }

    .timestamp {
      opacity: 0.7;
    }

    .message-text {
      line-height: 1.4;
      word-wrap: break-word;
    }

    .message-input-area {
      padding: 1.5rem;
      background: white;
      border-top: 1px solid #E5E7EB;
    }

    .input-container {
      display: flex;
      gap: 0.75rem;
      background: #F9FAFB;
      border: 2px solid #E5E7EB;
      border-radius: 25px;
      padding: 0.5rem;
      transition: all 0.3s ease;
    }

    .input-container:focus-within {
      border-color: #8B5CF6;
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
    }

    .message-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.95rem;
      outline: none;
      color: #1F2937;
    }

    .message-input::placeholder {
      color: #9CA3AF;
    }

    .send-btn {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.1rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
    }

    .send-btn:disabled {
      background: #9CA3AF;
      cursor: not-allowed;
      transform: none;
    }

    .file-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: 400px;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-left: 1px solid #E5E7EB;
      z-index: 10;
      overflow-y: auto;
      padding: 1rem;
    }

    .notifications-sidebar {
      width: 350px;
      background: linear-gradient(180deg, #374151 0%, #1F2937 100%);
      border-left: 1px solid rgba(139, 92, 246, 0.2);
    }

    .no-room-selected {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
    }

    .empty-state {
      text-align: center;
      max-width: 500px;
      padding: 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      color: #1F2937;
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .empty-state p {
      color: #6B7280;
      margin: 0 0 2rem 0;
      line-height: 1.5;
    }

    .features-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 2rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .feature-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.2);
    }

    .feature-icon {
      font-size: 1.5rem;
    }

    .feature-item span:last-child {
      color: #1F2937;
      font-weight: 500;
      font-size: 0.875rem;
    }

    /* Scrollbar customization */
    .chat-messages::-webkit-scrollbar, .file-panel::-webkit-scrollbar {
      width: 6px;
    }

    .chat-messages::-webkit-scrollbar-track, .file-panel::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-messages::-webkit-scrollbar-thumb, .file-panel::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.3);
      border-radius: 3px;
    }

    .chat-messages::-webkit-scrollbar-thumb:hover, .file-panel::-webkit-scrollbar-thumb:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  `,
  ],
})
export class ChatComponent implements OnInit, OnDestroy {
  rooms: ChatRoom[] = []
  currentRoom: ChatRoom | null = null
  messages: Message[] = []
  newMessage = ""
  newRoomName = ""
  connectionStatus: "connected" | "disconnected" = "disconnected"
  connectionStatusText = "Desconectado"
  currentUser: User | null = null
  showFileManager = false

  private subscription = new Subscription()
  private pollInterval = interval(2000)

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.currentUser = this.chatService.getCurrentUser()
    this.loadRooms()
    this.checkConnection()
    this.startPolling()
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  logout(): void {
    this.chatService.logout()
  }

  loadRooms(): void {
    this.subscription.add(
      this.chatService.getRooms().subscribe({
        next: (response: RoomsResponse) => {
          this.rooms = response.rooms || []
        },
        error: (error) => {
          console.error("Erro ao carregar salas:", error)
        },
      }),
    )
  }

  selectRoom(room: ChatRoom): void {
    this.currentRoom = room
    this.loadMessages(room.name)
  }

  loadMessages(roomName: string): void {
    this.subscription.add(
      this.chatService.getMessages(roomName).subscribe({
        next: (response: MessagesResponse) => {
          this.messages = response.messages || []
          this.scrollToBottom()
        },
        error: (error) => {
          console.error("Erro ao carregar mensagens:", error)
        },
      }),
    )
  }

  createRoom(): void {
    if (!this.newRoomName.trim()) return

    this.subscription.add(
      this.chatService.createRoom(this.newRoomName).subscribe({
        next: (room) => {
          this.rooms.push(room)
          this.newRoomName = ""
          this.selectRoom(room)
        },
        error: (error) => {
          console.error("Erro ao criar sala:", error)
        },
      }),
    )
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.currentRoom || !this.currentUser) return

    const request: SendMessageRequest = {
      room_name: this.currentRoom.name,
      sender_id: this.currentUser.id,
      content: this.newMessage,
      message_type: "text",
    }

    this.subscription.add(
      this.chatService.sendMessage(request).subscribe({
        next: (response) => {
          this.newMessage = ""
          this.loadMessages(this.currentRoom!.name)
        },
        error: (error) => {
          console.error("Erro ao enviar mensagem:", error)
        },
      }),
    )
  }

  toggleFileManager(): void {
    this.showFileManager = !this.showFileManager
  }

  checkConnection(): void {
    this.subscription.add(
      this.chatService.getRabbitMQStatus().subscribe({
        next: (response) => {
          this.connectionStatus = response.status === "connected" ? "connected" : "disconnected"
          this.connectionStatusText = response.status === "connected" ? "Conectado" : "Desconectado"
        },
        error: (error) => {
          this.connectionStatus = "disconnected"
          this.connectionStatusText = "Erro de Conexão"
          console.error("Erro ao verificar conexão:", error)
        },
      }),
    )
  }

  startPolling(): void {
    this.subscription.add(
      this.pollInterval.subscribe(() => {
        if (this.currentRoom) {
          this.loadMessages(this.currentRoom.name)
        }
        this.checkConnection()
      }),
    )
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString("pt-BR")
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector(".chat-messages")
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }, 100)
  }
}
