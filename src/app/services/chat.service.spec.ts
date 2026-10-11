import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { environment } from '../../environments/environment';

describe('ChatService', () => {

  let service: ChatService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the whole conversation with only role and content, and unwraps the reply', () => {
    let reply: unknown;
    service.ask([
      { role: 'user', content: 'How did SHP-1 do?' },
      { role: 'assistant', content: 'A profit.', toolsUsed: ['get_shipment'] },
      { role: 'user', content: 'And SHP-2?' },
    ]).subscribe(r => (reply = r));

    const request = http.expectOne(`${environment.apiUrl}/api/chat`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.messages).toEqual([
      { role: 'user', content: 'How did SHP-1 do?' },
      { role: 'assistant', content: 'A profit.' },
      { role: 'user', content: 'And SHP-2?' },
    ]);
    request.flush({ success: true, message: null, data: { reply: 'A loss.', toolsUsed: ['get_shipment'] } });

    expect(reply).toEqual({ reply: 'A loss.', toolsUsed: ['get_shipment'] });
  });
});
