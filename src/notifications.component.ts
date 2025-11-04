import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService, AppNotification, NotificationType } from './notifications.service';

type FilterType = 'all' | NotificationType;

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  notificationsService = inject(NotificationsService);
  
  activeFilter = signal<FilterType>('all');
  
  filteredNotifications = computed(() => {
    const notifications = this.notificationsService.notifications();
    const filter = this.activeFilter();
    if (filter === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.type === filter);
  });

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.read) {
      this.notificationsService.markAsRead(notification.id);
    }
    // In a real app, this might navigate to a detail screen
    console.log('Clicked notification:', notification.id);
  }
}
