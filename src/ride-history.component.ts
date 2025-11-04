import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { Ride, RideHistoryService } from './ride-history.service';

@Component({
  selector: 'app-ride-history',
  standalone: true,
  templateUrl: './ride-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideHistoryComponent {
  private historyService = inject(RideHistoryService);
  rides = signal<Ride[]>([]);

  back = output<void>();

  constructor() {
    this.rides.set(this.historyService.getHistory());
  }
}
