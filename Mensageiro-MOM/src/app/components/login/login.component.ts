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
      <div class="login-card">
        <div class="login-header">
          <h1>Mensageiro MOM</h1>
          <p>Sistema de Chat com Autenticação</p>
        </div>

        <div class="login-tabs">
          <button 
            [class.active]="!isRegister" 
            (click)="isRegister = false"
            class="tab-button">
            Login
          </button>
          <button 
            [class.active]="isRegister" 
            (click)="isRegister = true"
            class="tab-button">
            Registrar
          </button>
        </div>

        <div class="login-form" *ngIf="!isRegister">
          <h3>Fazer Login</h3>
          <form (ngSubmit)="onLogin()" #loginForm="ngForm">
            <div class="form-group">
              <label for="loginUsername">Usuário:</label>
              <input 
                id="loginUsername"
                type="text" 
                [(ngModel)]="loginData.username" 
                name="loginUsername"
                required
                placeholder="Digite seu usuário">
            </div>
            
            <div class="form-group">
              <label for="loginPassword">Senha:</label>
              <input 
                id="loginPassword"
                type="password" 
                [(ngModel)]="loginData.password" 
                name="loginPassword"
                required
                placeholder="Digite sua senha">
            </div>
            
            <button type="submit" [disabled]="loading || !loginForm.valid">
              {{ loading ? 'Entrando...' : 'Entrar' }}
            </button>
          </form>
        </div>

        <div class="register-form" *ngIf="isRegister">
          <h3>Criar Conta</h3>
          <form (ngSubmit)="onRegister()" #registerForm="ngForm">
            <div class="form-group">
              <label for="registerUsername">Usuário:</label>
              <input 
                id="registerUsername"
                type="text" 
                [(ngModel)]="registerData.username" 
                name="registerUsername"
                required
                placeholder="Digite um usuário">
            </div>
            
            <div class="form-group">
              <label for="registerEmail">Email (opcional):</label>
              <input 
                id="registerEmail"
                type="email" 
                [(ngModel)]="registerData.email" 
                name="registerEmail"
                placeholder="Digite seu email">
            </div>
            
            <div class="form-group">
              <label for="registerPassword">Senha:</label>
              <input 
                id="registerPassword"
                type="password" 
                [(ngModel)]="registerData.password" 
                name="registerPassword"
                required
                placeholder="Digite uma senha">
            </div>
            
            <div class="form-group">
              <label for="registerPasswordConfirm">Confirmar Senha:</label>
              <input 
                id="registerPasswordConfirm"
                type="password" 
                [(ngModel)]="registerData.password_confirm" 
                name="registerPasswordConfirm"
                required
                placeholder="Confirme a senha">
            </div>
            
            <button type="submit" [disabled]="loading || !registerForm.valid || !passwordsMatch()">
              {{ loading ? 'Criando...' : 'Criar Conta' }}
            </button>
          </form>
        </div>

        <div class="error-message" *ngIf="error">
          <p>{{ error }}</p>
        </div>

        <div class="success-message" *ngIf="success">
          <p>{{ success }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      padding: 2rem;
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h1 {
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
    }

    .login-header p {
      color: #7f8c8d;
      margin: 0;
      font-size: 1rem;
    }

    .login-tabs {
      display: flex;
      margin-bottom: 2rem;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #ddd;
    }

    .tab-button {
      flex: 1;
      padding: 1rem;
      border: none;
      background: #f8f9fa;
      color: #6c757d;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .tab-button.active {
      background: #007bff;
      color: white;
    }

    .tab-button:hover:not(.active) {
      background: #e9ecef;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #495057;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    button[type="submit"] {
      width: 100%;
      padding: 0.75rem;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    button[type="submit"]:hover:not(:disabled) {
      background: #218838;
    }

    button[type="submit"]:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .error-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
    }

    .success-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 6px;
    }

    h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      text-align: center;
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

  onLogin(): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.chatService.login(this.loginData).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Login realizado com sucesso!';
        this.chatService.setCurrentUser(response.user);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Erro ao fazer login';
      }
    });
  }

  onRegister(): void {
    if (!this.passwordsMatch()) {
      this.error = 'As senhas não coincidem';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.chatService.register(this.registerData).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Conta criada com sucesso! Faça login para continuar.';
        this.isRegister = false;
        this.registerData = {
          username: '',
          password: '',
          password_confirm: '',
          email: ''
        };
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Erro ao criar conta';
      }
    });
  }

  passwordsMatch(): boolean {
    return this.registerData.password === this.registerData.password_confirm;
  }
} 