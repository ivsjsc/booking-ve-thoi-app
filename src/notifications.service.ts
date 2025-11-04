import { Injectable, signal } from '@angular/core';

export type NotificationType = 'trip' | 'payment' | 'promo';

export interface AppNotification {
  id: string;
  type: NotificationType;
  icon: string; // Phosphor icon class
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private mockNotifications: AppNotification[] = [
    {
      id: 'n1',
      type: 'trip',
      icon: 'ph-check-circle',
      title: 'Chuyến đi đã hoàn tất',
      message: 'Chuyến đi của bạn đến 456 Đường XYZ đã kết thúc. Cảm ơn bạn!',
      timestamp: '5 phút trước',
      read: false
    },
    {
      id: 'n2',
      type: 'payment',
      icon: 'ph-receipt',
      title: 'Thanh toán thành công',
      message: 'Bạn đã thanh toán 150.000 ₫ cho chuyến đi gần nhất.',
      timestamp: '6 phút trước',
      read: true
    },
    {
      id: 'n3',
      type: 'promo',
      icon: 'ph-gift',
      title: 'Bạn có mã giảm giá mới!',
      message: 'Giảm 20% cho chuyến đi tiếp theo của bạn. Mã: VETHOI20',
      timestamp: '2 giờ trước',
      read: false
    },
    {
      id: 'n4',
      type: 'trip',
      icon: 'ph-star',
      title: 'Đừng quên đánh giá tài xế',
      message: 'Hãy đánh giá tài xế Nguyễn Văn B để giúp chúng tôi cải thiện dịch vụ.',
      timestamp: 'Hôm qua',
      read: true
    },
    {
      id: 'n5',
      type: 'payment',
      icon: 'ph-wallet',
      title: 'Nạp tiền vào ví thành công',
      message: 'Bạn đã nạp thành công 200.000 ₫ vào ví Về Thôi.',
      timestamp: '2 ngày trước',
      read: true
    }
  ];

  notifications = signal<AppNotification[]>(this.mockNotifications);

  getNotifications(): AppNotification[] {
    return this.notifications();
  }
  
  hasUnread(): boolean {
      return this.notifications().some(n => !n.read);
  }

  markAsRead(notificationId: string): void {
    this.notifications.update(notifications => 
      notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }
}
