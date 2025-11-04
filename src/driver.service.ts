import { Injectable, signal } from '@angular/core';

export interface Driver {
    name: string;
    photoUrl: string;
    vehicleModel: string;
    licensePlate: string;
    rating: number;
    phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private mockDrivers: Driver[] = [
    {
      name: 'Nguyễn Văn B',
      photoUrl: 'https://i.pravatar.cc/150?u=driver1',
      vehicleModel: 'Toyota Vios (Bạc)',
      licensePlate: '51K-123.45',
      rating: 4.8,
      phone: '0901234567'
    },
    {
      name: 'Trần Thị C',
      photoUrl: 'https://i.pravatar.cc/150?u=driver2',
      vehicleModel: 'Honda Wave Alpha (Đỏ)',
      licensePlate: '59T-888.99',
      rating: 4.9,
      phone: '0987654321'
    }
  ];

  getMockDriver(vehicleType: 'car' | 'motorbike' | null): Driver {
    if (vehicleType === 'car') {
      return this.mockDrivers[0];
    }
    return this.mockDrivers[1];
  }
}