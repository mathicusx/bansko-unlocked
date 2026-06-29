import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable success / error confirmation dialog. Mirrors the tour-detail
 * checkout success screen (themed-card overlay, centred icon + title + body +
 * close button) so contact-form / floating-help feedback reads as a proper
 * modal rather than a snackbar that's easy to miss.
 *
 * Controlled by the parent via *ngIf — the parent owns the open/close flag and
 * supplies the localised copy. Clicking the backdrop, the × or the primary
 * button all emit `closed`.
 */
@Component({
  selector: 'app-feedback-dialog',
  imports: [CommonModule, MatIconModule],
  templateUrl: './feedback-dialog.component.html',
  styleUrl: './feedback-dialog.component.scss',
})
export class FeedbackDialogComponent {
  @Input() type: 'success' | 'error' = 'success';
  @Input() title = '';
  @Input() message = '';
  @Input() closeLabel = 'Close';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
