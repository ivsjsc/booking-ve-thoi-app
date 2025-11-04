import { Component, ChangeDetectionStrategy, inject, viewChild, AfterViewInit, OnDestroy, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map.component';
import { BookingService } from './booking.service';
import { DriverService, Driver } from './driver.service';
import { LatLngTuple } from 'leaflet';

type TripStatus = 'finding' | 'enRouteToPickup' | 'inProgress' | 'completed';

// Declare L to have access to Leaflet's geometry utilities
declare var L: any;

@Component({
  selector: 'app-in-ride',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './in-ride.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InRideComponent implements AfterViewInit, OnDestroy {
  bookingService = inject(BookingService);
  driverService = inject(DriverService);

  mapComponent = viewChild(MapComponent);
  
  driver = signal<Driver | null>(null);
  tripStatus = signal<TripStatus>('finding');
  eta = signal(0); // in minutes
  
  // State for driver rating
  selectedRating = signal(0);
  hoveredRating = signal(0);
  ratingSubmitted = signal(false);
  
  // State for SOS modal
  showSosModal = signal(false);
  
  cancel = output<void>();

  private simulationInterval: any;

  // Computed properties for display
  title = computed(() => {
    switch(this.tripStatus()) {
      case 'finding': return 'Đang tìm tài xế...';
      case 'enRouteToPickup': return `${this.driver()?.name} đang đến!`;
      case 'inProgress': return `Đang trong chuyến đi`;
      case 'completed': return 'Chuyến đi hoàn tất!';
      default: return '';
    }
  });

  details = computed(() => {
    const eta = this.eta();
    switch(this.tripStatus()) {
      case 'finding': return 'Vui lòng chờ trong giây lát...';
      case 'enRouteToPickup': return eta > 0 ? `Dự kiến đến trong ${eta} phút.` : 'Tài xế đang đến rất gần.';
      case 'inProgress': return eta > 0 ? `Dự kiến tới nơi trong ${eta} phút.` : 'Bạn sắp đến nơi.';
      case 'completed': 
        return this.ratingSubmitted() 
          ? 'Cảm ơn bạn đã đánh giá!'
          : 'Cảm ơn bạn đã sử dụng dịch vụ Về Thôi!';
      default: return '';
    }
  });

  ngAfterViewInit(): void {
    // Start the simulation after a short delay to allow map initialization
    this.resetState();
    setTimeout(() => this.startDriverSearch(), 2000);
  }
  
  resetState(): void {
    this.driver.set(null);
    this.tripStatus.set('finding');
    this.eta.set(0);
    this.selectedRating.set(0);
    this.hoveredRating.set(0);
    this.ratingSubmitted.set(false);
    this.showSosModal.set(false);
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  startDriverSearch(): void {
    const vehicleType = this.bookingService.selectedVehicle();
    this.driver.set(this.driverService.getMockDriver(vehicleType));
    
    // Simulate finding a driver
    setTimeout(() => {
      this.tripStatus.set('enRouteToPickup');
      this.simulateTripToPickup();
    }, 2500);
  }

  simulateTripToPickup(): void {
    const pickupCoords = this.bookingService.pickup().coords;
    if (!pickupCoords) return;

    this.mapComponent()?.clearAllLayers();
    // Simulate driver starting from a nearby location
    const driverStartCoords: LatLngTuple = [pickupCoords[0] + 0.01, pickupCoords[1] + 0.01];

    this.mapComponent()?.updateDriverMarker(driverStartCoords);
    
    // The map component will calculate the route and duration, then trigger the simulation via the callback.
    this.mapComponent()?.drawRoute(
      driverStartCoords, 
      pickupCoords, 
      (details) => {
        this.runSimulation(driverStartCoords, pickupCoords, details.duration, details.coordinates, () => {
          this.mapComponent()?.updateDriverMarker(pickupCoords);
          this.startMainTrip();
        });
      }
    );
  }
  
  startMainTrip(): void {
    this.tripStatus.set('inProgress');
    const pickupCoords = this.bookingService.pickup().coords;
    const destCoords = this.bookingService.destination().coords;

    if (!pickupCoords || !destCoords) return;
    
    this.mapComponent()?.clearAllLayers();
    this.mapComponent()?.updateDriverMarker(pickupCoords);

    this.mapComponent()?.drawRoute(
      pickupCoords, 
      destCoords, 
      (details) => {
        this.runSimulation(pickupCoords, destCoords, details.duration, details.coordinates, () => {
          this.mapComponent()?.updateDriverMarker(destCoords);
          this.tripStatus.set('completed');
        });
      }
    );
  }

  private runSimulation(start: LatLngTuple, end: LatLngTuple, durationSeconds: number, routeCoords: LatLngTuple[], onComplete: () => void): void {
      if (this.simulationInterval) clearInterval(this.simulationInterval);
      if (!routeCoords || routeCoords.length < 2) {
          // Fallback to linear simulation if route coordinates are not available
          this.runLinearSimulation(start, end, durationSeconds, onComplete);
          return;
      }

      let progress = 0;
      const steps = Math.max(1, Math.round(durationSeconds));
      this.eta.set(Math.ceil(durationSeconds / 60));
      
      const routeLine = L.polyline(routeCoords);
      const totalDistance = this.calculateTotalDistance(routeCoords);

      this.simulationInterval = setInterval(() => {
        progress++;
        const t = progress / steps;

        if (t >= 1) {
          clearInterval(this.simulationInterval);
          this.eta.set(0);
          onComplete();
          return;
        }
        
        const currentDistance = totalDistance * t;
        const newPoint = this.getPointAtDistance(routeLine, currentDistance);

        if (newPoint) {
           this.mapComponent()?.updateDriverMarker([newPoint.lat, newPoint.lng]);
        }
        
        const remainingSeconds = durationSeconds * (1 - t);
        this.eta.set(Math.ceil(remainingSeconds / 60));

      }, 1000);
  }

  // --- Polyline helper methods for realistic simulation ---
  private calculateTotalDistance(coords: LatLngTuple[]): number {
      let totalDist = 0;
      for (let i = 0; i < coords.length - 1; i++) {
          totalDist += L.latLng(coords[i]).distanceTo(L.latLng(coords[i+1]));
      }
      return totalDist;
  }

  private getPointAtDistance(polyline: any, distance: number): any {
      let traveled: number = 0;
      const latlngs = polyline.getLatLngs();

      for (let i = 0; i < latlngs.length - 1; i++) {
          const start = latlngs[i];
          const end = latlngs[i+1];
          const segmentDistance = start.distanceTo(end);

          if (traveled + segmentDistance >= distance) {
              const ratio = (distance - traveled) / segmentDistance;
              return L.latLng(
                  start.lat + (end.lat - start.lat) * ratio,
                  start.lng + (end.lng - start.lng) * ratio
              );
          }
          traveled += segmentDistance;
      }
      return latlngs[latlngs.length - 1]; // Return last point if distance exceeds total
  }


  // Fallback linear simulation
  private runLinearSimulation(start: LatLngTuple, end: LatLngTuple, durationSeconds: number, onComplete: () => void): void {
      let progress = 0;
      const steps = Math.max(1, Math.round(durationSeconds));
      this.eta.set(Math.ceil(durationSeconds / 60));

      this.simulationInterval = setInterval(() => {
        progress++;
        const t = progress / steps;

        if (t >= 1) {
          clearInterval(this.simulationInterval);
          this.eta.set(0);
          onComplete();
          return;
        }
        
        const newLat = start[0] + (end[0] - start[0]) * t;
        const newLng = start[1] + (end[1] - start[1]) * t;
        
        this.mapComponent()?.updateDriverMarker([newLat, newLng]);

        const remainingSeconds = durationSeconds * (1-t);
        this.eta.set(Math.ceil(remainingSeconds / 60));

      }, 1000);
  }
  
  // --- Rating methods ---
  hoverRating(rating: number): void {
    this.hoveredRating.set(rating);
  }

  setRating(rating: number): void {
    this.selectedRating.set(rating);
  }

  submitRating(): void {
    const driver = this.driver();
    const rating = this.selectedRating();
    if (!driver || rating === 0) return;
    
    // In a real app, this would be an API call. Here, we store it locally.
    localStorage.setItem(`driver_rating_${driver.name}`, rating.toString());
    this.ratingSubmitted.set(true);
  }
  
  // --- SOS Methods ---
  triggerSOS(): void {
    this.showSosModal.set(true);
  }

  cancelSOS(): void {
    this.showSosModal.set(false);
  }

  // Mock function for sharing trip
  shareTrip(): void {
    // In a real app, this would use the Web Share API or similar
    alert('Đã sao chép thông tin chuyến đi để chia sẻ!');
    this.showSosModal.set(false);
  }

  onCancelOrNewBooking(): void {
    this.cancel.emit();
  }
  
  ngOnDestroy(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
  }
}
