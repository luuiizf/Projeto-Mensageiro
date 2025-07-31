import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-kong-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kong-status" *ngIf="showStatus">
      <div class="status-header">
        <h3>Status do Kong Gateway</h3>
        <button (click)="checkStatus()" [disabled]="loading">
          {{ loading ? 'Verificando...' : 'Verificar' }}
        </button>
      </div>
      
      <div class="status-content" *ngIf="status">
        <div class="status-item">
          <span class="label">Gateway:</span>
          <span class="value">{{ status.gateway }}</span>
        </div>
        <div class="status-item">
          <span class="label">Serviço:</span>
          <span class="value">{{ status.service }}</span>
        </div>
        <div class="status-item">
          <span class="label">Status:</span>
          <span class="value" [class]="status.status">{{ status.status }}</span>
        </div>
        <div class="status-item">
          <span class="label">Timestamp:</span>
          <span class="value">{{ formatTimestamp(status.timestamp) }}</span>
        </div>
        
        <div class="headers" *ngIf="status.headers">
          <h4>Headers do Kong:</h4>
          <div class="header-item" *ngFor="let header of getHeaders()">
            <span class="header-name">{{ header.key }}:</span>
            <span class="header-value">{{ header.value }}</span>
          </div>
        </div>
      </div>
      
      <div class="error" *ngIf="error">
        <p>Erro ao verificar status: {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .kong-status {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .status-header h3 {
      margin: 0;
      color: #495057;
    }

    .status-header button {
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .status-header button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .status-content {
      background: white;
      border-radius: 4px;
      padding: 1rem;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      padding: 0.25rem 0;
    }

    .label {
      font-weight: bold;
      color: #495057;
    }

    .value {
      color: #6c757d;
    }

    .value.connected {
      color: #28a745;
      font-weight: bold;
    }

    .value.disconnected {
      color: #dc3545;
      font-weight: bold;
    }

    .headers {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
    }

    .headers h4 {
      margin: 0 0 0.5rem 0;
      color: #495057;
    }

    .header-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .header-name {
      font-weight: bold;
      color: #495057;
    }

    .header-value {
      color: #6c757d;
      font-family: monospace;
    }

    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 4px;
      border: 1px solid #f5c6cb;
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
} 