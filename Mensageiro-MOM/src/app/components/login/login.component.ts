import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, LoginRequest, RegisterRequest } from '../../services/chat.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="background-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>

      <div class="login-card">
        <div class="login-header">
          <div class="app-icon">💬</div>
          <h1>Mensageiro MOM</h1>
          <p>Conecte-se e comece a conversar</p>
        </div>

        <div class="auth-tabs">
          <button
            [class.active]="!isRegister"
            (click)="switchToLogin()"
            class="tab-button">
            <span>Entrar</span>
          </button>
          <button
            [class.active]="isRegister"
            (click)="switchToRegister()"
            class="tab-button">
            <span>Registrar</span>
          </button>
          <div class="tab-indicator" [class.register]="isRegister"></div>
        </div>

        <div class="auth-forms">
          <div class="form-container" [class.slide-out]="isRegister" *ngIf="!isRegister">
            <h3>Bem-vindo de volta!</h3>
            <form (ngSubmit)="onLogin()" #loginForm="ngForm">
              <div class="input-group">
                <div class="input-wrapper">
                  <div class="input-icon">👤</div>
                  <input
                    id="loginUsername"
                    type="text"
                    [(ngModel)]="loginData.username"
                    name="loginUsername"
                    required
                    placeholder="Digite seu usuário">
                </div>
              </div>

              <div class="input-group">
                <div class="input-wrapper">
                  <div class="input-icon">🔒</div>
                  <input
                    id="loginPassword"
                    type="password"
                    [(ngModel)]="loginData.password"
                    name="loginPassword"
                    required
                    placeholder="Digite sua senha">
                </div>
              </div>

              <button type="submit" [disabled]="loading || !loginForm.valid" class="submit-btn login-btn">
                <span *ngIf="!loading">Entrar</span>
                <div *ngIf="loading" class="loading-spinner"></div>
                <span *ngIf="loading">Entrando...</span>
              </button>
            </form>
          </div>

          <div class="form-container" [class.slide-in]="isRegister" *ngIf="isRegister">
            <h3>Criar nova conta</h3>
            <form (ngSubmit)="onRegister()" #registerForm="ngForm">
              <div class="input-group">
                <div class="input-wrapper">
                  <div class="input-icon">👤</div>
                  <input
                    id="registerUsername"
                    type="text"
                    [(ngModel)]="registerData.username"
                    name="registerUsername"
                    required
                    placeholder="Escolha um usuário">
                </div>
              </div>

              <div class="input-group">
                <div class="input-wrapper">
                  <div class="input-icon">📧</div>
                  <input
                    id="registerEmail"
                    type="email"
                    [(ngModel)]="registerData.email"
                    name="registerEmail"
                    placeholder="Digite seu email (opcional)">
                </div>
              </div>

              <div class="input-group">
                <div class="input-wrapper">
                  <div class="input-icon">🔒</div>
                  <input
                    id="registerPassword"
                    type="password"
                    [(ngModel)]="registerData.password"
                    name="registerPassword"
                    required
                    placeholder="Crie uma senha">
                </div>
              </div>

              <div class="input-group">
                <div class="input-wrapper">
                  <div class="input-icon">🔒</div>
                  <input
                    id="registerPasswordConfirm"
                    type="password"
                    [(ngModel)]="registerData.password_confirm"
                    name="registerPasswordConfirm"
                    required
                    placeholder="Confirme sua senha"
                    [class.error]="registerData.password_confirm && !passwordsMatch()">
                </div>
                <div class="password-match-indicator" *ngIf="registerData.password_confirm">
                  <span *ngIf="passwordsMatch()" class="match-success">✅ Senhas coincidem</span>
                  <span *ngIf="!passwordsMatch()" class="match-error">❌ Senhas não coincidem</span>
                </div>
              </div>

              <button type="submit" [disabled]="loading || !registerForm.valid || !passwordsMatch()" class="submit-btn register-btn">
                <span *ngIf="!loading">Criar Conta</span>
                <div *ngIf="loading" class="loading-spinner"></div>
                <span *ngIf="loading">Criando...</span>
              </button>
            </form>
          </div>
        </div>

        <div class="message-container">
          <div class="error-message" *ngIf="error" [@slideInOut]>
            <div class="message-icon">❌</div>
            <div class="message-content">
              <h4>Oops! Algo deu errado</h4>
              <p>{{ error }}</p>
            </div>
          </div>

          <div class="success-message" *ngIf="success" [@slideInOut]>
            <div class="message-icon">✅</div>
            <div class="message-content">
              <h4>Sucesso!</h4>
              <p>{{ success }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
    }

    .login-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #8B5CF6 100%);
      padding: 2rem;
      position: relative;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .background-decoration {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .decoration-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      animation: float 6s ease-in-out infinite;
    }

    .circle-1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    .circle-2 {
      width: 150px;
      height: 150px;
      top: 60%;
      right: 15%;
      animation-delay: 2s;
    }

    .circle-3 {
      width: 100px;
      height: 100px;
      bottom: 15%;
      left: 20%;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .login-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      position: relative;
      animation: cardEntry 0.6s ease-out;
    }

    @keyframes cardEntry {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .app-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      padding: 1rem;
      border-radius: 20px;
      display: inline-block;
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
    }

    .login-header h1 {
      color: #1F2937;
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .login-header p {
      color: #6B7280;
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }

    .auth-tabs {
      display: flex;
      background: #F3F4F6;
      border-radius: 16px;
      padding: 4px;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }

    .tab-button {
      flex: 1;
      padding: 1rem;
      border: none;
      background: transparent;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
      font-size: 0.95rem;
      border-radius: 12px;
      position: relative;
      z-index: 2;
    }

    .tab-button.active {
      color: #1F2937;
    }

    .tab-indicator {
      position: absolute;
      top: 4px;
      left: 4px;
      width: calc(50% - 4px);
      height: calc(100% - 8px);
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      border-radius: 12px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
      z-index: 1;
    }

    .tab-indicator.register {
      transform: translateX(100%);
    }

    .auth-forms {
      position: relative;
      overflow: hidden;
    }

    .form-container {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .form-container h3 {
      margin: 0 0 1.5rem 0;
      color: #1F2937;
      text-align: center;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .input-group {
      margin-bottom: 1.5rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #F9FAFB;
      border: 2px solid #E5E7EB;
      border-radius: 16px;
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .input-wrapper:focus-within {
      border-color: #8B5CF6;
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
      background: white;
    }

    .input-wrapper.error {
      border-color: #EF4444;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
    }

    .input-icon {
      padding: 1rem;
      font-size: 1.1rem;
      color: #6B7280;
      background: transparent;
      border-right: 1px solid #E5E7EB;
    }

    .input-wrapper:focus-within .input-icon {
      color: #8B5CF6;
      border-color: rgba(139, 92, 246, 0.3);
    }

    .input-wrapper input {
      flex: 1;
      padding: 1rem;
      border: none;
      background: transparent;
      font-size: 1rem;
      outline: none;
      color: #1F2937;
      font-weight: 500;
    }

    .input-wrapper input::placeholder {
      color: #9CA3AF;
      font-weight: 400;
    }

    .password-match-indicator {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .match-success {
      color: #10B981;
    }

    .match-error {
      color: #EF4444;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 16px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      position: relative;
      overflow: hidden;
    }

    .login-btn {
      background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
    }

    .register-btn {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
    }

    .register-btn:hover:not(:disabled) {
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .submit-btn:disabled {
      background: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .message-container {
      margin-top: 1.5rem;
      min-height: 60px;
    }

    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 16px;
      animation: slideInUp 0.3s ease;
    }

    .error-message {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .success-message {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .message-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .message-content h4 {
      margin: 0 0 0.25rem 0;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .error-message .message-content h4 {
      color: #DC2626;
    }

    .success-message .message-content h4 {
      color: #059669;
    }

    .message-content p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
      font-weight: 500;
    }

    .error-message .message-content p {
      color: #EF4444;
    }

    .success-message .message-content p {
      color: #10B981;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .login-container {
        padding: 1rem;
      }

      .login-card {
        padding: 2rem;
      }

      .app-icon {
        font-size: 2.5rem;
        padding: 0.75rem;
      }

      .login-header h1 {
        font-size: 1.75rem;
      }
    }
  `]
})
export class LoginComponent {
  isRegister = false;
  loading = false;
  error = '';
  success = '';

  loginData: LoginRequest = {
    username: '',
    password: ''
  };

  registerData: RegisterRequest = {
    username: '',
    password: '',
    password_confirm: '',
    email: ''
  };

  constructor(private chatService: ChatService) {}

  switchToLogin(): void {
    this.isRegister = false;
    this.clearMessages();
  }

  switchToRegister(): void {
    this.isRegister = true;
    this.clearMessages();
  }

  clearMessages(): void {
    this.error = '';
    this.success = '';
  }

  onLogin(): void {
    this.loading = true;
    this.clearMessages();

    this.chatService.login(this.loginData).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Login realizado com sucesso! Redirecionando...';
        this.chatService.setCurrentUser(response.user);

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      }
    });
  }

  onRegister(): void {
    if (!this.passwordsMatch()) {
      this.error = 'As senhas não coincidem. Tente novamente.';
      return;
    }

    this.loading = true;
    this.clearMessages();

    this.chatService.register(this.registerData).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Conta criada com sucesso! Agora você pode fazer login.';

        setTimeout(() => {
          this.switchToLogin();
          this.registerData = {
            username: '',
            password: '',
            password_confirm: '',
            email: ''
          };
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Erro ao criar conta. Tente novamente.';
      }
    });
  }

  passwordsMatch(): boolean {
    return this.registerData.password === this.registerData.password_confirm;
  }
}
