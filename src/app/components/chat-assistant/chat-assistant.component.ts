import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../models/chat.model';

/** Readable names for the backend tools, shown under an answer as its sources. */
const TOOL_LABELS: Record<string, string> = {
  search_shipments: 'shipment search',
  get_shipment: 'shipment detail',
  list_profit_calculations: 'stored calculations',
  get_profit_summary: 'portfolio summary',
};

/**
 * Floating assistant that answers questions about shipments from the backend's
 * data. Collapsed to a button until opened; the conversation lives in memory and
 * is lost on reload, which keeps shipment data out of browser storage.
 */
@Component({
  selector: 'app-chat-assistant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './chat-assistant.component.html',
  styleUrl: './chat-assistant.component.css',
})
export class ChatAssistantComponent implements AfterViewChecked {

  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;

  readonly suggestions = [
    'How many shipments are at a loss?',
    'Which 3 shipments lost the most?',
    'Break down the costs of SHP-2026-0001',
  ];

  open = false;
  sending = false;
  errorMessage = '';
  messages: ChatMessage[] = [];

  question = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(4000)] });

  private scrollPending = false;

  constructor(private chatService: ChatService) {}

  toggle(): void {
    this.open = !this.open;
    this.scrollPending = this.open;
  }

  ngAfterViewChecked(): void {
    // after the new turn is rendered, so the scroll height already includes it
    if (this.scrollPending && this.scroller) {
      this.scroller.nativeElement.scrollTop = this.scroller.nativeElement.scrollHeight;
      this.scrollPending = false;
    }
  }

  ask(text: string = this.question.value): void {

    const content = text.trim();

    if (!content || this.sending) {
      return;
    }

    this.errorMessage = '';
    this.sending = true;
    this.messages = [...this.messages, { role: 'user', content }];
    this.question.reset();
    this.scrollPending = true;

    this.chatService.ask(this.messages).subscribe({
      next: reply => {
        this.sending = false;
        this.messages = [...this.messages, { role: 'assistant', content: reply.reply, toolsUsed: reply.toolsUsed }];
        this.scrollPending = true;
      },
      error: (error: HttpErrorResponse) => {
        this.sending = false;
        // the question stays in the conversation, so retrying is one click
        this.errorMessage = error.status === 0
          ? 'Could not reach the server. Check that the backend is running.'
          : error.error?.message ?? 'The assistant could not answer.';
      },
    });
  }

  /** Re-sends the conversation as it is, after a failed answer. */
  retry(): void {

    if (this.sending || !this.messages.length) {
      return;
    }

    const last = this.messages[this.messages.length - 1];
    this.messages = this.messages.slice(0, -1);
    this.ask(last.content);
  }

  clear(): void {
    this.messages = [];
    this.errorMessage = '';
  }

  sources(tools: string[] | undefined): string {
    return [...new Set((tools ?? []).map(tool => TOOL_LABELS[tool] ?? tool))].join(', ');
  }
}
