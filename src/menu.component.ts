import { Component, ChangeDetectionStrategy, output, input } from '@angular/core';
import { User } from './auth.service';

type Screen = 'profile' | 'settings' | 'rewards' | 'rideHistory' | 'driverInfo' | 'home';

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  close = output<void>();
  navigate = output<Screen>();
  logout = output<void>();
  user = input<User | null>();

  onNavigate(screen: Screen) {
    this.navigate.emit(screen);
  }
}
