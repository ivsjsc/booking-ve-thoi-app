import { Injectable } from '@angular/core';

export interface Ride {
  id: string;
  date: string;
  pickup: string;
  destination: string;
  price: string;
  serviceType: 'Lái xe HỘ' | 'Chở tôi về';
  vehicleIcon: 'ph-steering-wheel' | 'ph-car-profile';
}

@Injectable({
  providedIn: 'root'
})
export class RideHistoryService {

  private mockHistory: Ride[] = [
    {
      id: 'r1',
      date: '15/07/2024, 22:30',
      pickup: '123 Đường ABC, Quận 1',
      destination: '456 Đường XYZ, Quận 7',
      price: '150.000 ₫',
      serviceType: 'Lái xe HỘ',
      vehicleIcon: 'ph-steering-wheel'
    },
    {
      id: 'r2',
      date: '12/07/2024, 08:15',
      pickup: 'Sân bay Tân Sơn Nhất',
      destination: 'Khách sạn Rex, Quận 1',
      price: '85.000 ₫',
      serviceType: 'Chở tôi về',
      vehicleIcon: 'ph-car-profile'
    },
     {
      id: 'r3',
      date: '10/07/2024, 19:00',
      pickup: 'Vincom Center Đồng Khởi',
      destination: 'Chung cư The Sun Avenue, Quận 2',
      price: '45.000 ₫',
      serviceType: 'Chở tôi về',
      vehicleIcon: 'ph-car-profile'
    }
  ];

  getHistory(): Ride[] {
    return this.mockHistory;
  }
}
