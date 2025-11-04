import { Injectable, signal, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { debounceTime, switchMap, catchError, map } from 'rxjs/operators';
import { RouteDetails } from './map.component'; // Import the new interface

// Định nghĩa các kiểu dữ liệu (types) để sử dụng trong toàn ứng dụng
type ServiceType = 'ride' | 'designated_driver';
type VehicleType = 'car' | 'motorbike';
export type GeocodingResult = {
  id: string;
  place_name: string;
  center: [number, number]; // [lon, lat]
};

/**
 * Service này quản lý TOÀN BỘ trạng thái và logic liên quan đến
 * quá trình đặt xe (booking).
 */
@Injectable({
  providedIn: 'root', // Tự động cung cấp service này ở cấp độ gốc
})
export class BookingService {
  private http = inject(HttpClient);
  private readonly MAPBOX_API_KEY = 'pk.eyJ1IjoidHVrdHVrbG9uZ3RoYW5oIiwiYSI6ImNtaGtneTdzNDFtejcyaXE2Y2QyYWp2MmMifQ.6DL11itgw7JXe5JawsZ0Cw'; // Vui lòng thay thế khóa API Mapbox của bạn tại đây

  // --- Trạng thái Dịch vụ & Xe ---
  selectedService = signal<ServiceType | null>(null);
  selectedVehicle = signal<VehicleType | null>(null);

  // --- Trạng thái Địa điểm & Lộ trình ---
  pickup = signal<{ address: string; coords: [number, number] | null }>({ address: '', coords: null });
  destination = signal<{ address: string; coords: [number, number] | null }>({ address: '', coords: null });
  routeDetails = signal<RouteDetails | null>(null);

  // --- Trạng thái Tìm kiếm Địa chỉ ---
  private searchSubject = new Subject<string>();
  searchResults = signal<GeocodingResult[]>([]);
  isSearching = signal(false);
  activeInput = signal<'pickup' | 'destination' | null>(null);

  constructor() {
    // Logic tìm kiếm địa chỉ được chuyển vào service
    this.searchSubject.pipe(
      debounceTime(500), // Chờ 500ms sau khi người dùng ngừng gõ
      switchMap(query => {
        if (!query || query.length < 3) {
          this.searchResults.set([]);
          return of({ features: [] });
        }
        if (!this.MAPBOX_API_KEY.startsWith('pk.')) {
           if(isDevMode()) {
             console.warn('Khóa API Mapbox không hợp lệ hoặc chưa được thiết lập. Chức năng tìm kiếm sẽ không hoạt động. Vui lòng kiểm tra lại khóa trong src/booking.service.ts và src/map.component.ts.');
           }
           this.searchResults.set([]);
           return of({ features: [] });
        }
        this.isSearching.set(true);
        this.searchResults.set([]);
        // Sử dụng Mapbox Geocoding API
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.MAPBOX_API_KEY}&country=vn&language=vi&autocomplete=true&limit=5`;
        return this.http.get<{ features: GeocodingResult[] }>(url).pipe(
          catchError((err) => {
            console.error('Mapbox Geocoding API error:', err);
            return of({ features: [] }); // Bỏ qua lỗi và trả về đối tượng có features rỗng
          })
        );
      })
    ).subscribe(response => {
      this.searchResults.set(response.features);
      this.isSearching.set(false);
    });
  }

  // --- Phương thức Xử lý Input ---

  onPickupInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.pickup.set({ address: query, coords: null });
    this.searchSubject.next(query);
  }

  onDestinationInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.destination.set({ address: query, coords: null });
    this.searchSubject.next(query);
  }

  selectAddress(result: GeocodingResult): void {
    const active = this.activeInput();
    if (!active) return;

    const newLocation = {
      address: result.place_name,
      // Mapbox trả về [lon, lat], Leaflet cần [lat, lon]
      coords: [result.center[1], result.center[0]] as [number, number]
    };

    if (active === 'pickup') {
      this.pickup.set(newLocation);
    } else {
      this.destination.set(newLocation);
    }
    this.clearSearch();
  }

  handleMapSelection(selection: { address: string; coords: [number, number] }): void {
    const active = this.activeInput();
    if (!active) return;

    if (active === 'pickup') {
      this.pickup.set(selection);
    } else {
      this.destination.set(selection);
    }
    this.clearSearch();
  }

  clearSearch(): void {
    this.searchResults.set([]);
    this.activeInput.set(null);
    this.isSearching.set(false);
  }

  // --- Phương thức Lộ trình & Giá ---

  handleRouteFound(details: RouteDetails): void {
    this.routeDetails.set(details);
  }

  calculateCost(service: ServiceType, vehicle: VehicleType): string {
    const route = this.routeDetails();
    if (!route) return '0 ₫';

    const distanceInKm = route.distance / 1000;
    let cost = 0;

    // Logic tính giá (Nên được lấy từ CSDL/API trong tương lai)
    if (service === 'ride') {
        if (vehicle === 'car') {
            cost = 20000 + distanceInKm * 7000; // 20k base, 7k/km for car ride
        } else if (vehicle === 'motorbike') {
            cost = 15000 + distanceInKm * 5000; // 15k base, 5k/km for bike ride
        }
    } else if (service === 'designated_driver') {
        if (vehicle === 'car') {
            cost = 100000 + distanceInKm * 15000; // 100k base
        } else if (vehicle === 'motorbike') {
            cost = 70000 + distanceInKm * 10000; // 70k base
        }
    }
    return `${(Math.round(cost / 1000) * 1000).toLocaleString('vi-VN')} ₫`;
  }

  // --- Phương thức Luồng Đặt xe ---

  startNewBooking(): void {
    this.selectedService.set(null);
    this.selectedVehicle.set(null);
    this.destination.set({ address: '', coords: null });
    this.routeDetails.set(null);
    this.clearSearch();
    // Vị trí 'pickup' sẽ được cập nhật lại bởi `locateUser` từ component
  }

  getConfirmationDetails(): string {
    const service = this.selectedService();
    const vehicle = this.selectedVehicle();

    if (service === 'ride') {
        return `Dịch vụ "Chở tôi về" bằng ${vehicle === 'car' ? 'ô tô' : 'xe máy'}. Vui lòng chờ trong giây lát.`;
    } else if (service === 'designated_driver') {
        return `Dịch vụ "Lái xe hộ" cho ${vehicle === 'car' ? 'ô tô' : 'xe máy'} của bạn. Vui lòng chờ trong giây lát.`;
    }
    return 'Vui lòng chờ trong giây lát.';
  }
}