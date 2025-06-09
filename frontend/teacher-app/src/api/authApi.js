import { apiSlice } from './apiSlice';
import { setCredentials } from '../store/slices/authSlice';
import jwtDecode from 'jwt-decode';
import { toast } from 'react-toastify';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Ensure token and user data are available
          if (data.token && data.user) {
            // Use teacherToken consistently
            localStorage.setItem('teacherToken', data.token);
            dispatch(setCredentials({ token: data.token, user: data.user }));
            if (data.message) {
              toast.success(data.message || 'Đăng nhập thành công');
            }
          } else {
            console.error('Login response missing token or user data:', data);
            toast.error('Login failed: Invalid response format');
          }
        } catch (error) {
          console.error('Login failed:', error);
          // Display the server error message if available
          if (error?.error?.data?.message) {
            toast.error(error.error.data.message);
          } else {
            toast.error('Connection error. Please try again later.');
          }
        }
      },
    }),
    
    getCurrentUser: builder.query({
      query: () => 'auth/me',
      providesTags: ['User'],
      // Add error handling to prevent logout on failed requests
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          // Don't logout on 403 errors (just log them)
          if (error?.error?.status === 403) {
            console.warn('Permission denied for current user endpoint, but keeping session active');
          }
        }
      },
    }),
    
    changePassword: builder.mutation({
      query: (passwords) => ({
        url: 'auth/change-password',
        method: 'PUT',
        body: passwords,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useChangePasswordMutation,
} = authApi; 