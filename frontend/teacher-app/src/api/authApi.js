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
            dispatch(setCredentials({ token: data.token, user: data.user }));
            if (data.message) {
              toast.success(data.message);
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