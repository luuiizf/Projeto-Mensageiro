import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './components/chat/chat.component';
import { LoginComponent } from './components/login/login.component';
import { ChatService, User } from './services/chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatComponent, LoginComponent],
  template: `
    <app-login *ngIf="!currentUser"></app-login>
    <app-chat *ngIf="currentUser"></app-chat>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AppComponent {
  currentUser: User | null = null;

  constructor(private chatService: ChatService) {
    this.chatService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}
