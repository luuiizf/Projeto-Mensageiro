import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  username: string;
  email?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  room: string;
  room_name: string;
  sender: string;
  sender_username: string;
  content: string;
  timestamp: string;
  message_type: 'text' | 'system';
}

export interface ChatRoom {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface SendMessageRequest {
  room_name: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  password_confirm: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8000';
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users/register/`, request);
  }

  login(request: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users/login/`, request);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.apiUrl}/api/rooms/`);
  }

  getMessages(roomName: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/api/messages/${roomName}/`);
  }

  sendMessage(request: SendMessageRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/send-message/`, request);
  }

  createRoom(roomName: string): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(`${this.apiUrl}/api/rooms/`, { name: roomName });
  }

  updateMessages(messages: Message[]): void {
    this.messagesSubject.next(messages);
  }

  addMessage(message: Message): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  testRabbitMQConnection(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/rabbitmq/test_connection/`, {});
  }

  getRabbitMQStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/rabbitmq/status/`);
  }
} 