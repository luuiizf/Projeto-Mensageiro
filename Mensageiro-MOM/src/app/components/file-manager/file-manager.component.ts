import { Component, type OnInit, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { FileService, FileInfo } from "../../services/file.service"
import { ChatService } from "../../services/chat.service"

@Component({
  selector: "app-file-manager",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="file-manager">
      <div class="file-header">
        <div class="header-title">
          <div class="file-icon">📁</div>
          <h3>Compartilhar Arquivos</h3>
        </div>
        <button (click)="refreshFiles()" [disabled]="loading" class="refresh-btn">
          <span class="refresh-icon" [class.spinning]="loading">🔄</span>
        </button>
      </div>

      <!-- Upload Section -->
      <div class="upload-section">
        <div class="upload-area"
             [class.dragover]="isDragOver"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">
          <div class="upload-icon">📤</div>
          <p class="upload-text">
            <strong>Clique aqui</strong> ou arraste arquivos para enviar
          </p>
          <p class="upload-hint">Máximo 10MB por arquivo</p>
        </div>

        <input #fileInput
               type="file"
               multiple
               (change)="onFileSelected($event)"
               style="display: none">
      </div>

      <!-- Upload Progress -->
      <div class="upload-progress" *ngIf="uploadingFiles.length > 0">
        <div class="progress-item" *ngFor="let upload of uploadingFiles">
          <div class="progress-info">
            <span class="file-name">{{ upload.name }}</span>
            <span class="progress-percent">{{ upload.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="upload.progress"></div>
          </div>
        </div>
      </div>

      <!-- Files List -->
      <div class="files-section" *ngIf="files.length > 0">
        <div class="section-title">
          <span>Arquivos Compartilhados</span>
          <div class="files-count">{{ files.length }}</div>
        </div>

        <div class="files-list">
          <div class="file-item" *ngFor="let file of files">
            <div class="file-info">
              <div class="file-icon">{{ getFileIcon(file.filename) }}</div>
              <div class="file-details">
                <span class="file-name">{{ file.filename }}</span>
                <span class="file-meta">
                  {{ formatFileSize(file.size) }} • {{ formatDate(file.upload_date) }}
                </span>
              </div>
            </div>
            <div class="file-actions">
              <button (click)="downloadFile(file)" class="action-btn download">
                <span>⬇️</span>
              </button>
              <button (click)="shareFileToChat(file)" class="action-btn share">
                <span>💬</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="files.length === 0 && !loading">
        <div class="empty-icon">📂</div>
        <h4>Nenhum arquivo compartilhado</h4>
        <p>Faça upload de arquivos para compartilhar com outros usuários</p>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Carregando arquivos...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error">
        <div class="error-icon">❌</div>
        <div class="error-content">
          <h4>Erro ao carregar arquivos</h4>
          <p>{{ error }}</p>
          <button (click)="refreshFiles()" class="retry-btn">Tentar novamente</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .file-manager {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      margin-top: 1rem;
    }

    .file-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .file-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #06FFA5 0%, #00D4FF 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .file-header h3 {
      margin: 0;
      color: #F9FAFB;
      font-size: 1.1rem;
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
    }

    .refresh-btn:hover:not(:disabled) {
      background: rgba(139, 92, 246, 0.3);
      transform: scale(1.05);
    }

    .refresh-icon.spinning {
      animation: spin 1s linear infinite;
    }

    .upload-section {
      margin-bottom: 1.5rem;
    }

    .upload-area {
      border: 2px dashed rgba(139, 92, 246, 0.3);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.05);
    }

    .upload-area:hover, .upload-area.dragover {
      border-color: #8B5CF6;
      background: rgba(139, 92, 246, 0.1);
      transform: translateY(-2px);
    }

    .upload-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      opacity: 0.7;
    }

    .upload-text {
      margin: 0 0 0.5rem 0;
      color: #F3F4F6;
      font-size: 1rem;
    }

    .upload-hint {
      margin: 0;
      color: #9CA3AF;
      font-size: 0.875rem;
    }

    .upload-progress {
      margin-bottom: 1.5rem;
    }

    .progress-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.5rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .file-name {
      color: #F3F4F6;
      font-weight: 500;
    }

    .progress-percent {
      color: #8B5CF6;
      font-weight: 600;
    }

    .progress-bar {
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #8B5CF6 0%, #A855F7 100%);
      transition: width 0.3s ease;
    }

    .files-section {
      margin-bottom: 1rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      color: #D1D5DB;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .files-count {
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-weight: 500;
    }

    .files-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.75rem;
      transition: all 0.3s ease;
    }

    .file-item:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(139, 92, 246, 0.3);
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .file-details {
      display: flex;
      flex-direction: column;
    }

    .file-details .file-name {
      color: #F3F4F6;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .file-meta {
      color: #9CA3AF;
      font-size: 0.75rem;
    }

    .file-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.3s ease;
    }

    .action-btn.download {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
    }

    .action-btn.share {
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
    }

    .action-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .empty-state, .loading-state, .error-state {
      text-align: center;
      padding: 2rem;
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

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(139, 92, 246, 0.2);
      border-top-color: #8B5CF6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
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

    /* Scrollbar */
    .files-list::-webkit-scrollbar {
      width: 4px;
    }

    .files-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .files-list::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.3);
      border-radius: 2px;
    }
  `,
  ],
})
export class FileManagerComponent implements OnInit {
  @Input() currentRoom: any = null

  files: FileInfo[] = []
  loading = false
  error = ""
  isDragOver = false
  uploadingFiles: Array<{ name: string; progress: number }> = []

  constructor(
    private fileService: FileService,
    private chatService: ChatService,
  ) {}

  ngOnInit(): void {
    this.loadFiles()
  }

  loadFiles(): void {
    this.loading = true
    this.error = ""

    this.fileService.listFiles().subscribe({
      next: (files) => {
        this.files = files
        this.loading = false
      },
      error: (error) => {
        this.error = error.message || "Erro ao carregar arquivos"
        this.loading = false
      },
    })
  }

  refreshFiles(): void {
    this.loadFiles()
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault()
    this.isDragOver = true
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    this.isDragOver = false
  }

  onDrop(event: DragEvent): void {
    event.preventDefault()
    this.isDragOver = false

    const files = event.dataTransfer?.files
    if (files) {
      this.uploadFiles(Array.from(files))
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files
    if (files) {
      this.uploadFiles(Array.from(files))
    }
  }

  uploadFiles(files: File[]): void {
    if (!this.currentRoom) {
      alert("Selecione uma sala primeiro!")
      return
    }

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        alert(`Arquivo ${file.name} é muito grande (máximo 10MB)`)
        return
      }

      const uploadProgress = { name: file.name, progress: 0 }
      this.uploadingFiles.push(uploadProgress)

      this.fileService.uploadFile(file, this.currentRoom.name).subscribe({
        next: (response) => {
          uploadProgress.progress = 100
          setTimeout(() => {
            this.uploadingFiles = this.uploadingFiles.filter((u) => u !== uploadProgress)
            this.loadFiles() // Recarregar lista
          }, 1000)
        },
        error: (error) => {
          console.error("Erro no upload:", error)
          this.uploadingFiles = this.uploadingFiles.filter((u) => u !== uploadProgress)
          alert(`Erro ao enviar ${file.name}: ${error.message}`)
        },
      })

      // Simular progresso (já que SOAP não tem progresso real)
      const interval = setInterval(() => {
        if (uploadProgress.progress < 90) {
          uploadProgress.progress += 10
        } else {
          clearInterval(interval)
        }
      }, 200)
    })
  }

  downloadFile(file: FileInfo): void {
    this.fileService.downloadFile(file.file_id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      },
      error: (error) => {
        alert(`Erro ao baixar arquivo: ${error.message}`)
      },
    })
  }

  shareFileToChat(file: FileInfo): void {
    if (!this.currentRoom) return

    const currentUser = this.chatService.getCurrentUser()
    if (!currentUser) return

    const message = {
      room_name: this.currentRoom.name,
      sender_id: currentUser.id,
      content: `📎 Arquivo compartilhado: ${file.filename}`,
      message_type: "file" as const,
    }

    this.chatService.sendMessage(message).subscribe({
      next: () => {
        console.log("Arquivo compartilhado no chat")
      },
      error: (error) => {
        console.error("Erro ao compartilhar no chat:", error)
      },
    })
  }

  getFileIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase()

    switch (ext) {
      case "pdf":
        return "📄"
      case "doc":
      case "docx":
        return "📝"
      case "xls":
      case "xlsx":
        return "📊"
      case "ppt":
      case "pptx":
        return "📈"
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️"
      case "mp4":
      case "avi":
      case "mov":
        return "🎥"
      case "mp3":
      case "wav":
        return "🎵"
      case "zip":
      case "rar":
        return "🗜️"
      default:
        return "📄"
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }
}
