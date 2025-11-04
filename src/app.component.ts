import { ChangeDetectionStrategy, Component, signal, effect, viewChild, untracked, inject, computed } from '@angular/core';
import { MapComponent, LocationUpdate } from '@/src/map.component';
import { BookingService, GeocodingResult } from '@/src/booking.service';
import { InRideComponent } from '@/src/in-ride.component';
import { AuthService } from '@/src/auth.service';
import { MenuComponent } from '@/src/menu.component';
import { ProfileComponent } from '@/src/profile.component';
import { SettingsComponent } from '@/src/settings.component';
import { RewardsComponent } from '@/src/rewards.component';
import { RideHistoryComponent } from '@/src/ride-history.component';
import { DriverInfoComponent } from '@/src/driver-info.component';
import { NotificationsComponent } from '@/src/notifications.component';
import { NotificationsService } from '@/src/notifications.service';

type Screen = 
  // Booking Flow
  'home' | 'rideVehicleType' | 'vehicleType' | 'inRide' | 'addressSearch' | 'payment' |
  // Auth Flow
  'welcome' | 'login' | 'signup' | 'phoneAuth' |
  // Management Screens
  'profile' | 'settings' | 'rewards' | 'rideHistory' | 'driverInfo' | 'notifications';

type ServiceType = 'ride' | 'designated_driver';
type VehicleType = 'car' | 'motorbike';
type PaymentMethod = 'cash' | 'card' | 'ewallet';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MapComponent, 
    InRideComponent,
    MenuComponent,
    ProfileComponent,
    SettingsComponent,
    RewardsComponent,
    RideHistoryComponent,
    DriverInfoComponent,
    NotificationsComponent
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  mapComponent = viewChild(MapComponent);
  
  public bookingService = inject(BookingService);
  public authService = inject(AuthService);
  public notificationsService = inject(NotificationsService);

  currentScreen = signal<Screen>('welcome');
  locationAddress = signal<string>(''); 
  locationStatus = signal<'loading' | 'success' | 'error' | 'idle'>('loading');
  isMenuOpen = signal(false);
  
  selectedPaymentMethod = signal<PaymentMethod>('cash');
  showPaymentModal = signal(false);

  mainScreens = new Set(['home', 'rideHistory', 'rewards', 'profile']);
  
  hasUnreadNotifications = computed(() => this.notificationsService.hasUnread());

  constructor() {
    // Determine initial screen based on auth state
    if (this.authService.isAuthenticated()) {
      this.currentScreen.set('home');
    }

    effect(() => {
      const p = this.bookingService.pickup().coords;
      const d = this.bookingService.destination().coords;
      const map = this.mapComponent();

      if (p && d && map) {
        map.drawRoute(p, d);
      } else {
        untracked(() => {
          if(this.bookingService.routeDetails() !== null) {
            this.bookingService.routeDetails.set(null);
          }
        });
        map?.clearRoute();
      }
    });
  }
  
  // --- Computed signals for display in the template ---
  serviceName = computed(() => this.bookingService.selectedService() === 'ride' ? 'Chở tôi về' : 'Lái xe HỘ');
  
  vehicleName = computed(() => {
    const service = this.bookingService.selectedService();
    const vehicle = this.bookingService.selectedVehicle();
    if (service === 'ride') {
        return vehicle === 'car' ? 'Ô tô' : 'Xe máy';
    }
    return vehicle === 'car' ? 'Ô tô của bạn' : 'Xe máy của bạn';
  });
  
  totalCost = computed(() => {
    const service = this.bookingService.selectedService();
    const vehicle = this.bookingService.selectedVehicle();
    if (!service || !vehicle) return '0 ₫';
    return this.bookingService.calculateCost(service, vehicle);
  });

  // --- Auth Flow ---
  login(success: boolean): void {
    if (success) {
      this.authService.login('user@email.com', 'password');
      this.currentScreen.set('home');
    }
  }

  loginAsGuest(): void {
    this.authService.loginAsGuest();
    this.currentScreen.set('home');
  }

  signup(success: boolean): void {
     if (success) {
      this.authService.signup('New User', 'new@email.com', 'password');
      this.currentScreen.set('home');
    }
  }

  logout(): void {
    this.authService.logout();
    this.isMenuOpen.set(false);
    this.currentScreen.set('welcome');
  }

  // --- Navigation ---
  openMenu(): void {
    this.isMenuOpen.set(true);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  navigateTo(screen: Screen): void {
    // Protect profile screen from guests
    if (this.authService.isGuest() && screen === 'profile') {
      this.logout();
      return;
    }
    this.currentScreen.set(screen);
    this.isMenuOpen.set(false);
  }

  // --- Location & Map Handling ---
  handleLocationUpdate(update: LocationUpdate): void {
    this.locationStatus.set(update.status);
    
    if (update.status === 'success' && update.address && update.coords) {
       this.bookingService.pickup.set({ address: update.address, coords: update.coords });
    } else if (update.status === 'error' && update.address) {
       this.locationAddress.set(update.address);
    }
  }

  handleMapSelection(selection: { address: string; coords: [number, number] }): void {
    const currentActive = this.bookingService.activeInput();
    this.bookingService.handleMapSelection(selection);
    if (currentActive) {
      this.currentScreen.set('home');
    }
  }

  // --- Booking Flow ---
  goBackToHome(): void {
    this.bookingService.clearSearch(); 
    this.currentScreen.set('home');
  }

  showAddressSearch(type: 'pickup' | 'destination'): void {
    this.bookingService.activeInput.set(type);
    this.currentScreen.set('addressSearch');
  }

  onSearchInput(event: Event): void {
    if (this.bookingService.activeInput() === 'pickup') {
      this.bookingService.onPickupInput(event);
    } else {
      this.bookingService.onDestinationInput(event);
    }
  }

  selectSearchResult(result: GeocodingResult): void {
    this.bookingService.selectAddress(result);
    this.currentScreen.set('home');
  }

  cancelSearch(): void {
    this.bookingService.clearSearch();
    this.currentScreen.set('home');
  }

  selectOnMap(): void {
    this.currentScreen.set('home');
  }

  selectService(service: ServiceType): void {
    this.bookingService.selectedService.set(service);
    
    if (service === 'designated_driver') {
      this.currentScreen.set('vehicleType');
    } else if (service === 'ride') {
      this.currentScreen.set('rideVehicleType');
    }
  }
  
  selectRideVehicle(vehicle: VehicleType): void {
    this.bookingService.selectedVehicle.set(vehicle);
    this.currentScreen.set('payment');
  }
  
  selectVehicle(vehicle: VehicleType): void {
    this.bookingService.selectedVehicle.set(vehicle);
    this.currentScreen.set('payment');
  }

  goBackToVehicleSelection(): void {
    const service = this.bookingService.selectedService();
    if (service === 'ride') {
        this.currentScreen.set('rideVehicleType');
    } else {
        this.currentScreen.set('vehicleType');
    }
  }
  
  proceedToConfirmation(): void {
    this.showPaymentModal.set(true);
  }

  confirmPayment(): void {
    this.showPaymentModal.set(false);
    this.currentScreen.set('inRide');
  }

  cancelPaymentConfirmation(): void {
    this.showPaymentModal.set(false);
  }
  
  handleTripCancellation(): void {
    this.startNewBooking();
  }

  startNewBooking(): void {
    this.currentScreen.set('home');
    this.bookingService.startNewBooking();
    this.mapComponent()?.clearAllLayers();
    this.mapComponent()?.locateUser(); 
  }
}