import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../store/slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:5003/api/v1/',
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem('token') || getState().auth.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    
    return headers;
  },
  credentials: 'include',
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401 || result?.error?.status === 403) {
    console.log('Authentication error:', result.error);
    
    api.dispatch(logout());
    
    window.location.href = '/login';
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Course', 'Student', 'Assignment', 'Notification'],
  endpoints: () => ({}),
}); 