import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"

export interface Notification {
  id: string
  user: string
  user_username: string
  room: string | null
  room_name: string | null
  notification_type: "message" | "file_upload" | "user_join" | "user_leave" | "system"
  title: string
  message: string
  priority: "low" | "medium" | "high" | "urgent"
  is_read: boolean
  created_at: string
  data: any
}

export interface NotificationResponse {
  notifications: Notification[]
  _links: any
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private apiUrl = "http://localhost:8000"

  constructor(private http: HttpClient) {}

  getNotifications(userId?: string): Observable<NotificationResponse> {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    const userIdParam = userId || currentUser.id

    return this.http.get<NotificationResponse>(`${this.apiUrl}/api/notifications/?user_id=${userIdParam}`)
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/notifications/${notificationId}/mark_read/`, {})
  }

  markAllAsRead(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/notifications/mark_all_read/`, { user_id: userId })
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/notifications/${notificationId}/`)
  }

  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/api/notifications/`, notification)
  }
}
