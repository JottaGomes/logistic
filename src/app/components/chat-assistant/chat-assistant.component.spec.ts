import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ChatAssistantComponent } from './chat-assistant.component';
import { ChatService } from '../../services/chat.service';

describe('ChatAssistantComponent', () => {

  let fixture: ComponentFixture<ChatAssistantComponent>;
  let component: ChatAssistantComponent;
  let service: jasmine.SpyObj<ChatService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ChatService>('ChatService', ['ask']);

    await TestBed.configureTestingModule({
      imports: [ChatAssistantComponent],
      providers: [{ provide: ChatService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts collapsed and opens on the launcher', () => {
    expect(fixture.nativeElement.querySelector('.panel')).toBeNull();

    fixture.nativeElement.querySelector('.launcher').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.panel')).not.toBeNull();
  });

  it('sends the conversation and appends the answer with its sources', () => {
    service.ask.and.returnValue(of({ reply: 'Two shipments are at a loss.', toolsUsed: ['get_profit_summary'] }));

    component.ask('How many shipments are at a loss?');

    expect(service.ask).toHaveBeenCalledWith([{ role: 'user', content: 'How many shipments are at a loss?' }]);
    expect(component.messages.map(m => m.role)).toEqual(['user', 'assistant']);
    expect(component.sources(component.messages[1].toolsUsed)).toBe('portfolio summary');
    expect(component.question.value).toBe('');
  });

  it('ignores a blank question', () => {
    component.ask('   ');

    expect(service.ask).not.toHaveBeenCalled();
  });

  it('shows the backend message when the assistant is not configured, and retries the same question', () => {
    service.ask.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 503,
      error: { success: false, message: 'The chat assistant is not configured. Set GROQ_API_KEY on the backend.', data: null },
    })));

    component.ask('Hello');

    expect(component.errorMessage).toContain('GROQ_API_KEY');
    expect(component.messages.length).toBe(1);

    service.ask.and.returnValue(of({ reply: 'Hi', toolsUsed: [] }));
    component.retry();

    expect(service.ask).toHaveBeenCalledTimes(2);
    expect(service.ask.calls.mostRecent().args[0]).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(component.messages.map(m => m.content)).toEqual(['Hello', 'Hi']);
    expect(component.errorMessage).toBe('');
  });

  /** Pressing Enter submits the form; it must send the question, not reload the page. */
  it('sends the question when the form is submitted, without a native page submit', () => {
    service.ask.and.returnValue(of({ reply: 'Fine', toolsUsed: [] }));
    component.toggle();
    fixture.detectChanges();

    component.question.setValue('How is SHP-1?');
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    const submit = new Event('submit', { cancelable: true });
    form.dispatchEvent(submit);

    expect(submit.defaultPrevented).toBeTrue();
    expect(service.ask).toHaveBeenCalledWith([{ role: 'user', content: 'How is SHP-1?' }]);
  });
});
