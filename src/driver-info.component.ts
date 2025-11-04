import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-driver-info',
  standalone: true,
  templateUrl: './driver-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverInfoComponent {
  back = output<void>();
}
