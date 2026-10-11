import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ChatMessage, ChatReply } from '../models/chat.model';

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

/**
 * Talks to the backend's shipment assistant. The backend keeps no conversation
 * state, so every question is sent together with the turns before it.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {

  private readonly url = `${environment.apiUrl}/api/chat`;

  constructor(private http: HttpClient) {}

  ask(conversation: ChatMessage[]): Observable<ChatReply> {
    // only role and content: the backend rejects anything else in a turn
    const messages = conversation.map(({ role, content }) => ({ role, content }));

    return this.http
      .post<ApiResponse<ChatReply>>(this.url, { messages })
      .pipe(map(res => res.data));
  }
}
