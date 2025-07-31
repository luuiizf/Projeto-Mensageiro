import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { NotificationService, Notification } from "../../services/notification.service"
import { Subscription, interval } from "rxjs"

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-panel">
      <div class="notifications-header">
        <div class="header-title">
          <div class="notification-icon">🔔</div>
          <h3>Notificações</h3>
          <div class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</div>
        </div>
        <div class="header-actions">
          <button (click)="markAllAsRead()"
                  [disabled]="unreadCount === 0"
                  class="mark-all-btn">
            <span>✓</span>
          </button>
          <button (click)="refreshNotifications()"
                  [disabled]="loading"
                  class="refresh-btn">
            <span class="refresh-icon" [class.spinning]="loading">🔄</span>
          </button>
        </div>
      </div>

      <div class="notifications-content">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading && notifications.length === 0">
          <div class="loading-spinner"></div>
          <p>Carregando notificações...</p>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list" *ngIf="notifications.length > 0">
          <div class="notification-item"
               *ngFor="let notification of notifications"
               [class.unread]="!notification.is_read"
               [class]="'priority-' + notification.priority"
               (click)="markAsRead(notification)">

            <div class="notification-indicator">
              <div class="indicator-dot"
                   [class]="getNotificationClass(notification)"></div>
            </div>

            <div class="notification-content">
              <div class="notification-header">
                <span class="notification-title">{{ notification.title }}</span>
                <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
              </div>

              <div class="notification-message">{{ notification.message }}</div>

              <div class="notification-meta" *ngIf="notification.room_name">
                <span class="room-tag">#{{ notification.room_name }}</span>
                <span class="notification-type">{{ getTypeLabel(notification.notification_type) }}</span>
              </div>
            </div>

            <div class="notification-actions">
              <button (click)="markAsRead(notification); $event.stopPropagation()"
                      *ngIf="!notification.is_read"
                      class="action-btn read">
                <span>👁️</span>
              </button>
              <button (click)="deleteNotification(notification); $event.stopPropagation()"
                      class="action-btn delete">
                <span>🗑️</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="notifications.length === 0 && !loading">
          <div class="empty-icon">🔔</div>
          <h4>Nenhuma notificação</h4>
          <p>Você está em dia! Não há notificações pendentes.</p>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="error">
          <div class="error-icon">❌</div>
          <div class="error-content">
            <h4>Erro ao carregar notificações</h4>
            <p>{{ error }}</p>
            <button (click)="refreshNotifications()" class="retry-btn">Tentar novamente</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .notifications-panel {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .notifications-header {
      padding: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .notification-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #F59E0B 0%, #EAB308 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .notifications-header h3 {
      margin: 0;
      color: #F9FAFB;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .notification-badge {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
      animation: pulse 2s infinite;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .mark-all-btn, .refresh-btn {
      width: 32px;
      height: 32px;
      background: rgba(139, 92, 246, 0.2);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .mark-all-btn:hover:not(:disabled), .refresh-btn:hover:not(:disabled) {
      background: rgba(139, 92, 246, 0.3);
      transform: scale(1.05);
    }

    .mark-all-btn:disabled, .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .refresh-icon.spinning {
      animation: spin 1s linear infinite;
    }

    .notifications-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .notifications-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      margin-bottom: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .notification-item:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(139, 92, 246, 0.3);
      transform: translateX(2px);
    }

    .notification-item.unread {
      border-left: 4px solid #8B5CF6;
      background: rgba(139, 92, 246, 0.1);
    }

    .notification-item.priority-high {
      border-left-color: #EF4444;
    }

    .notification-item.priority-urgent {
      border-left-color: #DC2626;
      animation: urgentPulse 2s infinite;
    }

    .notification-indicator {
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .indicator-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .indicator-dot.message {
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
    }

    .indicator-dot.file_upload {
      background: #F59E0B;
      box-shadow: 0 0 8px #F59E0B;
    }

    .indicator-dot.system {
      background: #8B5CF6;
      box-shadow: 0 0 8px #8B5CF6;
    }

    .indicator-dot.user_join {
      background: #06FFA5;
      box-shadow: 0 0 8px #06FFA5;
    }

    .indicator-dot.user_leave {
      background: #EF4444;
      box-shadow: 0 0 8px #EF4444;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .notification-title {
      color: #F3F4F6;
      font-weight: 600;
      font-size: 0.9rem;
      line-height: 1.3;
    }

    .notification-time {
      color: #9CA3AF;
      font-size: 0.75rem;
      white-space: nowrap;
      margin-left: 0.5rem;
    }

    .notification-message {
      color: #D1D5DB;
      font-size: 0.85rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
      word-wrap: break-word;
    }

    .notification-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .room-tag {
      background: rgba(139, 92, 246, 0.2);
      color: #A855F7;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-weight: 500;
    }

    .notification-type {
      color: #9CA3AF;
      font-size: 0.75rem;
      text-transform: capitalize;
    }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .notification-item:hover .notification-actions {
      opacity: 1;
    }

    .action-btn {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      transition: all 0.3s ease;
    }

    .action-btn.read {
      background: rgba(16, 185, 129, 0.2);
      color: #10B981;
    }

    .action-btn.delete {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
    }

    .action-btn:hover {
      transform: scale(1.1);
    }

    .loading-state, .empty-state, .error-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(139, 92, 246, 0.2);
      border-top-color: #8B5CF6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    .empty-icon, .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h4, .error-content h4 {
      color: #F3F4F6;
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }

    .empty-state p, .error-content p, .loading-state p {
      color: #9CA3AF;
      margin: 0;
      font-size: 0.875rem;
    }

    .retry-btn {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.3s ease;
    }

    .retry-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes urgentPulse {
      0%, 100% {
        border-left-color: #DC2626;
        box-shadow: 0 0 0 rgba(220, 38, 38, 0);
      }
      50% {
        border-left-color: #FCA5A5;
        box-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
      }
    }

    /* Scrollbar */
    .notifications-list::-webkit-scrollbar {
      width: 4px;
    }

    .notifications-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .notifications-list::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.3);
      border-radius: 2px;
    }
  `,
  ],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = []
  loading = false
  error = ""
  unreadCount = 0

  private subscription = new Subscription()
  private pollInterval = interval(5000) // Poll a cada 5 segundos

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications()
    this.startPolling()
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  loadNotifications(): void {
    this.loading = true
    this.error = ""

    this.subscription.add(
      this.notificationService.getNotifications().subscribe({
        next: (response) => {
          this.notifications = response.notifications || []
          this.updateUnreadCount()
          this.loading = false
        },
        error: (error) => {
          this.error = error.message || "Erro ao carregar notificações"
          this.loading = false
        },
      }),
    )
  }

  refreshNotifications(): void {
    this.loadNotifications()
  }

  markAsRead(notification: Notification): void {
    if (notification.is_read) return

    this.subscription.add(
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.is_read = true
          this.updateUnreadCount()
        },
        error: (error) => {
          console.error("Erro ao marcar como lida:", error)
        },
      }),
    )
  }

  markAllAsRead(): void {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    if (!currentUser.id) return

    this.subscription.add(
      this.notificationService.markAllAsRead(currentUser.id).subscribe({
        next: () => {
          this.notifications.forEach((n) => (n.is_read = true))
          this.updateUnreadCount()
        },
        error: (error) => {
          console.error("Erro ao marcar todas como lidas:", error)
        },
      }),
    )
  }

  deleteNotification(notification: Notification): void {
    this.subscription.add(
      this.notificationService.deleteNotification(notification.id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter((n) => n.id !== notification.id)
          this.updateUnreadCount()
        },
        error: (error) => {
          console.error("Erro ao deletar notificação:", error)
        },
      }),
    )
  }

  startPolling(): void {
    this.subscription.add(
      this.pollInterval.subscribe(() => {
        this.loadNotifications()
      }),
    )
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter((n) => !n.is_read).length
  }

  getNotificationClass(notification: Notification): string {
    return notification.notification_type
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      message: "Mensagem",
      file_upload: "Arquivo",
      user_join: "Entrada",
      user_leave: "Saída",
      system: "Sistema",
    }
    return labels[type] || type
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`

    return date.toLocaleDateString("pt-BR")
  }
}
