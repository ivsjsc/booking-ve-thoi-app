import { Injectable } from '@angular/core';

export interface Voucher {
  id: string;
  title: string;
  description: string;
  expiryDate: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class RewardsService {

  private mockVouchers: Voucher[] = [
    {
      id: 'v1',
      title: 'Giảm 20% cho chuyến đi tiếp theo',
      description: 'Áp dụng cho các chuyến đi bằng ô tô dưới 100.000 ₫.',
      expiryDate: '31/12/2024',
      code: 'VETHOI20'
    },
    {
      id: 'v2',
      title: 'Giảm 15.000 ₫',
      description: 'Áp dụng cho mọi loại hình dịch vụ.',
      expiryDate: '30/11/2024',
      code: 'ANTOAN15K'
    },
    {
      id: 'v3',
      title: 'Miễn phí chuyến xe máy',
      description: 'Giảm giá tối đa 30.000 ₫ cho chuyến đi bằng xe máy.',
      expiryDate: '15/11/2024',
      code: 'XEOMFREE'
    }
  ];

  getVouchers(): Voucher[] {
    return this.mockVouchers;
  }
}
