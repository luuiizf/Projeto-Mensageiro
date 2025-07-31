import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-kong-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kong-status" *ngIf="showStatus">
      <div class="status-card">
        <div class="status-header">
          <div class="header-left">
            <div class="kong-icon">⚡</div>
            <h3>Kong Gateway</h3>
          </div>
          <button (click)="checkStatus()" [disabled]="loading" class="refresh-btn">
            <span class="refresh-icon" [class.spinning]="loading">🔄</span>
          </button>
        </div>

        <div class="status-content" *ngIf="status">
          <div class="status-grid">
            <div class="status-item">
              <div class="item-label">Gateway</div>
              <div class="item-value primary">{{ status.gateway }}</div>
            </div>
            <div class="status-item">
              <div class="item-label">Serviço</div>
              <div class="item-value secondary">{{ status.service }}</div>
            </div>
            <div class="status-item">
              <div class="item-label">Status</div>
              <div class="item-value" [class]="getStatusClass(status.status)">
                <span class="status-dot" [class]="getStatusClass(status.status)"></span>
                {{ status.status }}
              </div>
            </div>
            <div class="status-item">
              <div class="item-label">Última verificação</div>
              <div class="item-value timestamp">{{ formatTimestamp(status.timestamp) }}</div>
            </div>
          </div>

          <div class="headers-section" *ngIf="status.headers && getHeaders().length > 0">
            <div class="section-title">
              <span>Headers do Kong</span>
              <div class="section-badge">{{ getHeaders().length }}</div>
            </div>
            <div class="headers-list">
              <div class="header-item" *ngFor="let header of getHeaders()">
                <span class="header-name">{{ header.key }}</span>
                <span class="header-value">{{ header.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="error-state" *ngIf="error">
          <div class="error-icon">❌</div>
          <div class="error-content">
            <h4>Erro de Conexão</h4>
            <p>{{ error }}</p>
          </div>
        </div>

        <div class="loading-state" *ngIf="loading && !status">
          <div class="loading-spinner"></div>
          <p>Verificando status...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kong-status {
      margin-top: auto;
      padding: 1rem;
    }

    .status-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      padding: 1.25rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .status-card:hover {
      border-color: rgba(139, 92, 246, 0.4);
      box-shadow: 0 12px 40px rgba(139, 92, 246, 0.15);
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .kong-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #F59E0B 0%, #EAB308 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .status-header h3 {
      margin: 0;
      color: #F9FAFB;
      font-size: 1rem;
      font-weight: 600;
    }

    .refresh-btn {
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
      backdrop-filter: blur(10px);
    }

    .refresh-btn:hover:not(:disabled) {
      background: rgba(139, 92, 246, 0.3);
      border-color: rgba(139, 92, 246, 0.5);
      transform: scale(1.05);
    }

    .refresh-btn:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .refresh-icon {
      font-size: 0.9rem;
      transition: transform 0.3s ease;
    }

    .refresh-icon.spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .status-content {
      animation: fadeInUp 0.3s ease;
    }

    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .status-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 0.75rem;
      transition: all 0.3s ease;
    }

    .status-item:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(139, 92, 246, 0.3);
    }

    .item-label {
      font-size: 0.75rem;
      color: #D1D5DB;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .item-value {
      font-size: 0.875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .item-value.primary {
      color: #06FFA5;
    }

    .item-value.secondary {
      color: #00D4FF;
    }

    .item-value.connected {
      color: #10B981;
    }

    .item-value.disconnected {
      color: #EF4444;
    }

    .item-value.timestamp {
      color: #F3F4F6;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-dot.connected {
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
    }

    .status-dot.disconnected {
      background: #EF4444;
      box-shadow: 0 0 8px #EF4444;
    }

    .headers-section {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 1rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      color: #D1D5DB;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .section-badge {
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-weight: 500;
    }

    .headers-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 120px;
      overflow-y: auto;
    }

    .header-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    .header-name {
      color: #06FFA5;
      font-weight: 600;
    }

    .header-value {
      color: #F3F4F6;
      font-family: 'Courier New', monospace;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .error-state {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      padding: 1rem;
      animation: fadeInUp 0.3s ease;
    }

    .error-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .error-content h4 {
      margin: 0 0 0.25rem 0;
      color: #FCA5A5;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .error-content p {
      margin: 0;
      color: #FED7D7;
      font-size: 0.8rem;
      line-height: 1.4;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      animation: fadeInUp 0.3s ease;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(139, 92, 246, 0.2);
      border-top-color: #8B5CF6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-state p {
      margin: 0;
      color: #D1D5DB;
      font-size: 0.875rem;
      font-weight: 500;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Scrollbar customization */
    .headers-list::-webkit-scrollbar {
      width: 4px;
    }

    .headers-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .headers-list::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.3);
      border-radius: 2px;
    }

    .headers-list::-webkit-scrollbar-thumb:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  `]
})
export class KongStatusComponent implements OnInit {
  status: any = null;
  error: string = '';
  loading: boolean = false;
  showStatus: boolean = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.showStatus = true;
      this.checkStatus();
    }, 3000);
  }

  checkStatus(): void {
    this.loading = true;
    this.error = '';

    fetch('http://localhost:8000/api/kong/status/')
      .then(response => response.json())
      .then(data => {
        this.status = data;
        this.loading = false;
      })
      .catch(err => {
        this.error = err.message;
        this.loading = false;
      });
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('pt-BR');
  }

  getHeaders(): Array<{key: string, value: string}> {
    if (!this.status?.headers) return [];

    return Object.entries(this.status.headers).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }

  getStatusClass(status: string): string {
    return status === 'connected' ? 'connected' : 'disconnected';
  }
}
