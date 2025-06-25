import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { NotificationData } from '@/src/services/notification/types';
import { NOTIFICATION_TYPES } from '@/src/services/notification/constants';

export function useNotificationResponse() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, []);

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;
    
    if (!data) return;

    switch (data.type) {
      case NOTIFICATION_TYPES.TRIP_UPDATE:
        if (data.id) {
          router.push(`/trips/${data.id}`);
        }
        break;

      case NOTIFICATION_TYPES.EXPENSE_ALERT:
        if (data.id) {
          router.push(`/expenses/${data.id}`);
        }
        break;

      case NOTIFICATION_TYPES.FRIEND_REQUEST:
        router.push('/profile_screens/FriendsScreen');
        break;

      case NOTIFICATION_TYPES.TRIP_REMINDER:
        if (data.id) {
          router.push(`/trips/${data.id}`);
        }
        break;

      default:
        // If a custom route is provided in the notification data
        if (data.route) {
          router.push(data.route);
        }
    }
  };
} 