import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  authService = inject(AuthService);
  
  navigateToSettings = output<void>();
}
