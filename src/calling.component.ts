import { Component, ChangeDetectionStrategy, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Driver } from './driver.service';

@Component({
  selector: 'app-calling',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calling.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallingComponent implements OnInit, OnDestroy {
  driver = input.required<Driver>();
  hangUp = output<void>();

  callDuration = signal('00:00');
  isMuted = signal(false);
  isSpeakerOn = signal(false);
  showKeypad = signal(false);
  
  private timerInterval: any;
  private callStartTime: number = 0;

  ngOnInit(): void {
    this.callStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
      this.callDuration.set(this.formatTime(elapsedSeconds));
    }, 1000);
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
  }

  toggleMute(): void {
    this.isMuted.update(v => !v);
  }

  toggleSpeaker(): void {
    this.isSpeakerOn.update(v => !v);
  }

  toggleKeypad(): void {
    this.showKeypad.update(v => !v);
  }

  onHangUp(): void {
    this.hangUp.emit();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}