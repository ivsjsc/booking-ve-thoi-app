import {
  Component,
  AfterViewInit,
  ElementRef,
  viewChild,
  OnDestroy,
  ChangeDetectionStrategy,
  isDevMode,
  PLATFORM_ID,
  output,
  signal,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, debounceTime } from 'rxjs';
import type { Map, Marker, LatLngTuple } from 'leaflet';
import 'leaflet-routing-machine'; // Import for type augmentation

// Declare L to have access to the routing machine plugin
declare var L: any;

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LocationUpdate {
  status: GeolocationStatus;
  address?: string;
  coords?: [number, number];
}

export interface RouteDetails {
    distance: number;
    duration: number;
    coordinates: LatLngTuple[];
}


@Component({
  selector: 'app-map',
  standalone: true,
  template: `
    <div #map class="w-full h-full z-0"></div>
    <button (click)="locateUser()" [disabled]="geolocationStatus() === 'loading'" title="Find my location" class="absolute bottom-28 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center w-12 h-12">
      @if (geolocationStatus() === 'loading') {
        <svg class="animate-spin h-6 w-6 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      } @else {
        <i class="ph-bold ph-crosshair text-2xl"></i>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('map');
  
  private http = inject(HttpClient);
  private readonly MAPBOX_API_KEY = 'pk.eyJ1IjoidHVrdHVrbG9uZ3RoYW5oIiwiYSI6ImNtaGtneTdzNDFtejcyaXE2Y2QyYWp2MmMifQ.6DL11itgw7JXe5JawsZ0Cw'; // Vui lòng thay thế khóa API Mapbox của bạn tại đây
  private map: Map | undefined;
  private userMarker: Marker | undefined;
  private driverMarker: Marker | undefined;
  private routingControl: any;
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private poiLayer: any; // L.LayerGroup
  private tempSelectionMarker: Marker | undefined;
  private poiFetchSubject = new Subject<void>();
  private poiFetchSubscription: Subscription | undefined;

  // --- Component I/O ---
  selectionMode = input<'pickup' | 'destination' | null>(null);
  
  geolocationStatus = signal<GeolocationStatus>('idle');
  locationUpdate = output<LocationUpdate>();
  routeFound = output<RouteDetails>();
  mapSelection = output<{ address: string; coords: [number, number] }>();

  constructor() {}

  async ngAfterViewInit(): Promise<void> {
    if (this.isBrowser) {
      setTimeout(() => this.initMap(), 0);
      
      this.poiFetchSubscription = this.poiFetchSubject.pipe(
        debounceTime(1500)
      ).subscribe(() => this._fetchAndDisplayPois());
    }
  }

  private initMap(): void {
    if (!L || this.map) return;

    const hcmcCoords: [number, number] = [10.7769, 106.7009]; 

    this.map = L.map(this.mapContainer().nativeElement, {
      center: hcmcCoords,
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
    
    this.poiLayer = L.layerGroup().addTo(this.map);

    this.map.on('click', (e: any) => this.onMapClick(e));
    this.map.on('moveend', () => this.poiFetchSubject.next());

    this.locateUser();
    this.poiFetchSubject.next();
  }

  private onMapClick(e: any): void {
    if (!this.MAPBOX_API_KEY.startsWith('pk.')) {
        if (isDevMode()) {
          console.warn('Khóa API Mapbox không hợp lệ hoặc chưa được thiết lập. Vui lòng kiểm tra lại khóa trong src/booking.service.ts và src/map.component.ts.');
        }
        this.mapSelection.emit({ address: 'Chức năng tìm kiếm địa chỉ chưa được cấu hình.', coords: [e.latlng.lat, e.latlng.lng] });
        return;
    }
    const selectionMode = this.selectionMode();
    if (!selectionMode) return;

    const { lat, lng } = e.latlng;

    if (this.tempSelectionMarker) {
      this.tempSelectionMarker.setLatLng([lat, lng]);
    } else {
      const selectionIcon = L.divIcon({
        html: `<div class="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg"></div>`,
        className: 'user-location-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      this.tempSelectionMarker = L.marker([lat, lng], { icon: selectionIcon }).addTo(this.map!);
    }
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.MAPBOX_API_KEY}&language=vi&limit=1`;
    this.http.get<{ features: { place_name: string }[] }>(url).subscribe({
      next: (data) => {
        const displayAddress = data.features.length > 0 ? data.features[0].place_name : 'Không thể xác định địa chỉ.';
        this.mapSelection.emit({ address: displayAddress, coords: [lat, lng] });
        this.tempSelectionMarker?.bindPopup(`<b>${selectionMode === 'pickup' ? 'Điểm đón' : 'Điểm đến'}</b><br>${displayAddress}`).openPopup();
      },
      error: (err: HttpErrorResponse) => {
        if (isDevMode()) {
          console.error(`Map click reverse geocoding error: Status ${err.status} - ${err.statusText}. Message: ${err.message}`);
        }
        this.mapSelection.emit({ address: 'Không thể xác định địa chỉ.', coords: [lat, lng] });
      }
    });
  }

  private _fetchAndDisplayPois(): void {
    if (!this.map || this.map.getZoom() < 14) {
        this.poiLayer.clearLayers();
        return;
    }

    const bounds = this.map.getBounds();
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"restaurant|cafe|bar|pub|fast_food|fuel"](${bbox});
        node["shop"~"supermarket|convenience|mall"](${bbox});
        node["tourism"~"hotel|hostel|guest_house"](${bbox});
      );
      out body;
      >;
      out skel qt;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    this.http.get<any>(url).subscribe({
      next: data => {
        this.poiLayer.clearLayers();
        const poiIcon = L.divIcon({
            html: `<div></div>`,
            className: 'poi-icon',
            iconSize: [10, 10],
            iconAnchor: [5, 5]
        });

        data.elements.forEach((poi: any) => {
          if (poi.tags && poi.tags.name) {
            const marker = L.marker([poi.lat, poi.lon], { icon: poiIcon })
              .bindTooltip(poi.tags.name, { direction: 'top', offset: [0, -5] })
              .on('click', () => {
                if (this.selectionMode()) {
                   this.mapSelection.emit({ address: poi.tags.name, coords: [poi.lat, poi.lon] });
                }
              });
            this.poiLayer.addLayer(marker);
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        if (isDevMode()) {
          console.error(`POI Fetch Error: Status ${err.status} - ${err.statusText}. Message: ${err.message}`);
        }
      }
    });
  }

  drawRoute(startCoords: LatLngTuple, endCoords: LatLngTuple, onRouteFoundCallback?: (details: RouteDetails) => void): void {
    if (!this.map) return;
    this.clearTemporaryMarkers();
    this.clearRoute();

    this.routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startCoords[0], startCoords[1]),
            L.latLng(endCoords[0], endCoords[1])
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        show: false,
        lineOptions: {
          styles: [{color: '#16a34a', opacity: 0.9, weight: 7}]
        },
        createMarker: () => null
    }).on('routesfound', (e: any) => {
        const routes = e.routes;
        if (routes.length > 0) {
            const summary = routes[0].summary;
            const coordinates: LatLngTuple[] = routes[0].coordinates.map((coord: any) => [coord.lat, coord.lng]);
            const routeDetails: RouteDetails = { 
                distance: summary.totalDistance, 
                duration: summary.totalTime,
                coordinates: coordinates
            };
            
            this.routeFound.emit(routeDetails);

            if (onRouteFoundCallback) {
                onRouteFoundCallback(routeDetails);
            }
            
            this.map?.fitBounds(L.latLngBounds(startCoords, endCoords), { padding: [70, 70] });
        }
    }).addTo(this.map);
  }
  
  clearTemporaryMarkers() {
    if (this.tempSelectionMarker) {
        this.tempSelectionMarker.remove();
        this.tempSelectionMarker = undefined;
    }
  }

  clearRoute(): void {
    if (this.map && this.routingControl) {
        this.map.removeControl(this.routingControl);
        this.routingControl = null;
    }
  }

  clearAllLayers(): void {
    this.clearRoute();
    this.clearTemporaryMarkers();
     if (this.driverMarker) {
      this.driverMarker.remove();
      this.driverMarker = undefined;
    }
  }

  updateDriverMarker(coords: LatLngTuple): void {
    if(!this.map) return;
    const driverIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-brand-secondary rounded-full border-2 border-white shadow-lg flex items-center justify-center transform rotate-45"><i class="ph-bold ph-car text-lg text-black"></i></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    if(this.driverMarker) {
      this.driverMarker.setLatLng(coords);
    } else {
      this.driverMarker = L.marker(coords, { icon: driverIcon, zIndexOffset: 1000 }).addTo(this.map);
    }
  }
  
  private reverseGeocode(lat: number, lon: number): void {
    if (!this.MAPBOX_API_KEY.startsWith('pk.')) {
      this.locationUpdate.emit({ status: 'success', address: 'Vị trí hiện tại', coords: [lat, lon] });
      this.userMarker?.bindPopup(`<b>Vị trí của bạn</b>`).openPopup();
      return;
    }
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${this.MAPBOX_API_KEY}&language=vi&limit=1`;
    this.http.get<{ features: { place_name: string }[] }>(url).subscribe({
      next: (data) => {
        const displayAddress = data.features.length > 0 ? data.features[0].place_name : 'Không thể xác định địa chỉ.';
        this.locationUpdate.emit({ status: 'success', address: displayAddress, coords: [lat, lon] });
        this.userMarker?.bindPopup(`<b>Vị trí của bạn</b>`).openPopup();
      },
      error: (err: HttpErrorResponse) => {
        if (isDevMode()) {
            console.error(`Reverse geocoding error: Status ${err.status} - ${err.statusText}. Message: ${err.message}`);
        }
        this.locationUpdate.emit({ status: 'success', address: 'Không thể xác định địa chỉ.', coords: [lat, lon] });
      }
    });
  }

  locateUser(): void {
    if (!this.map || !navigator.geolocation) return;

    this.geolocationStatus.set('loading');
    this.locationUpdate.emit({ status: 'loading' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.geolocationStatus.set('success');
        const { latitude, longitude } = position.coords;
        const userCoords: [number, number] = [latitude, longitude];
        this.map?.setView(userCoords, 16);

        const userIcon = L.divIcon({
          html: `<div class="w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-lg"></div>`,
          className: 'user-location-icon',
          iconSize: [21, 21],
          iconAnchor: [10.5, 10.5]
        });

        if (this.userMarker) {
          this.userMarker.setLatLng(userCoords);
        } else {
          this.userMarker = L.marker(userCoords, { icon: userIcon }).addTo(this.map!);
        }
        
        this.reverseGeocode(latitude, longitude);
      },
      (error) => {
        this.geolocationStatus.set('error');
        if (isDevMode()) console.error('Geolocation error:', error.message);
        this.locationUpdate.emit({ status: 'error', address: 'Không thể lấy vị trí của bạn.' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  ngOnDestroy(): void {
    this.poiFetchSubscription?.unsubscribe();
    this.map?.remove();
  }
}