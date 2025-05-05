import { apiSlice } from './apiSlice';
import { setNotifications } from '../store/slices/uiSlice';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({
        url: 'notifications',
        params,
      }),
      providesTags: ['Notification'],
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setNotifications({
            notifications: data.notifications,
            unreadCount: data.unreadCount,
          }));
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
        }
      },
    }),
    
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    
    markAllAsRead: builder.mutation({
      query: () => ({
        url: 'notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    
    sendNotification: builder.mutation({
      query: (data) => ({
        url: 'notifications/send',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notification'],
    }),
    
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useSendNotificationMutation,
  useDeleteNotificationMutation,
} = notificationApi; 