import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { RewardsService, Voucher } from './rewards.service';

@Component({
  selector: 'app-rewards',
  standalone: true,
  templateUrl: './rewards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RewardsComponent {
  private rewardsService = inject(RewardsService);
  vouchers = signal<Voucher[]>([]);
  
  back = output<void>();

  constructor() {
    this.vouchers.set(this.rewardsService.getVouchers());
  }
}
