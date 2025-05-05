import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventServices } from '@/services/api';
import { getEventDetail } from '@/services/eventServices';

export const fetchUpcomingEvents = createAsyncThunk(
  'events/fetchUpcoming',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventServices.getUpcomingEvents();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Không thể tải sự kiện sắp diễn ra' });
    }
  }
);

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await eventServices.getAllEvents(filters);
      console.log('Events API Response:', response);

      if (!response.data) {
        throw new Error('No data received from API');
      }

      // Validate và format dữ liệu
      const events = Array.isArray(response.data) ? response.data : [];
      return events.map(event => ({
        ...event,
        EventDate: event.EventDate || new Date().toISOString().split('T')[0],
        EventTime: event.EventTime || '00:00:00',
        Price: parseFloat(event.Price) || 0,
        MaxAttendees: parseInt(event.MaxAttendees) || 0,
        CurrentAttendees: parseInt(event.CurrentAttendees) || 0
      }));
    } catch (error) {
      console.error('Fetch events error:', error);
      return rejectWithValue(
        error.response?.data || { 
          message: 'Không thể tải sự kiện',
          error: error.message 
        }
      );
    }
  }
);

export const registerEvent = createAsyncThunk(
  'events/registerEvent',
  async ({ eventId, userData = {} }, { rejectWithValue }) => {
    try {
      console.log('Attempting to register for event:', eventId);
      
      const response = await eventServices.registerForEvent(eventId, userData);
      console.log('Registration successful:', response);
      return { 
        success: true, 
        message: 'Đăng ký tham gia sự kiện thành công!', 
        data: response.data 
      };
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Đăng ký thất bại. Vui lòng thử lại sau.';
      
      return rejectWithValue({ 
        message: errorMessage,
        error: error.toString()
      });
    }
  }
);

export const fetchEventDetail = createAsyncThunk(
  'events/fetchEventDetail',
  async (eventId, { rejectWithValue }) => {
    try {
      // Use the directly imported getEventDetail function
      const response = await getEventDetail(eventId);
      
      if (!response.data) {
        throw new Error('Không tìm thấy thông tin sự kiện');
      }

      // Format the event data before returning it
      const eventData = {
        ...response.data,
        EventDate: response.data.EventDate || new Date().toISOString().split('T')[0],
        EventTime: response.data.EventTime || '00:00:00',
        Price: parseFloat(response.data.Price) || 0,
        MaxAttendees: parseInt(response.data.MaxAttendees) || 0,
        CurrentAttendees: parseInt(response.data.CurrentAttendees) || 0,
        // Make sure these arrays exist even if not provided by backend
        schedule: Array.isArray(response.data.schedule) ? response.data.schedule : [],
        prizes: Array.isArray(response.data.prizes) ? response.data.prizes : [],
        languages: Array.isArray(response.data.languages) ? response.data.languages : [],
        technologies: Array.isArray(response.data.technologies) ? response.data.technologies : []
      };

      return eventData;
    } catch (error) {
      // Không reject với lỗi authentication
      if (error.response?.status === 401) {
        return rejectWithValue({ 
          message: 'Vui lòng đăng nhập để xem chi tiết',
          isAuthError: true 
        });
      }
      return rejectWithValue({ 
        message: 'Không thể tải thông tin sự kiện',
        error: error.message 
      });
    }
  }
);

export const cancelRegistration = createAsyncThunk(
  'events/cancelRegistration',
  async (eventId, { rejectWithValue }) => {
    try {
      console.log('Attempting to cancel registration for event:', eventId);
      
      // Use eventServices directly now that we've fixed it
      const response = await eventServices.cancelEventRegistration(eventId);
      console.log('Cancel registration successful:', response);
      return { success: true, message: 'Hủy đăng ký sự kiện thành công!', data: response.data };
    } catch (error) {
      console.error('Cancel registration failed:', error);
      const errorMessage = 
        error.message || 
        error.response?.data?.message || 
        'Hủy đăng ký thất bại. Vui lòng thử lại sau.';
      
      return rejectWithValue({ 
        message: errorMessage,
        error: error.toString()
      });
    }
  }
);

export const checkRegistrationStatus = createAsyncThunk(
  'events/checkRegistrationStatus',
  async (eventId, { rejectWithValue }) => {
    try {
      console.log('Checking registration status for event:', eventId);
      
      const response = await eventServices.checkEventRegistration(eventId);
      console.log('Check registration status successful:', response);
      
      // Make sure we properly extract the response data
      const data = response.data || response;
      
      return {
        isRegistered: data.isRegistered || false,
        registrationInfo: data.registrationInfo || null
      };
    } catch (error) {
      console.error('Check registration status failed:', error);
      return { isRegistered: false, registrationInfo: null };
    }
  }
);

const initialState = {
  events: [],
  upcomingEvents: [],
  loading: false,
  error: null,
  filters: {
    category: 'all',
    difficulty: 'all',
    status: 'upcoming'
  },
  currentEvent: null,
  isRegistered: false,
  registrationInfo: null,
  registrationLoading: false
};

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
      state.isRegistered = false;
      state.registrationInfo = null;
    },
    setRegistrationStatus: (state, action) => {
      state.isRegistered = action.payload.isRegistered;
      state.registrationInfo = action.payload.registrationInfo;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload || [];
        state.error = null;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.events = [];
        state.error = action.payload?.message || 'Lỗi khi tải sự kiện';
      })
      .addCase(fetchUpcomingEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingEvents = action.payload;
      })
      .addCase(fetchUpcomingEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Lỗi khi tải sự kiện sắp diễn ra';
      })
      .addCase(fetchEventDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload;
        state.error = null;
      })
      .addCase(fetchEventDetail.rejected, (state, action) => {
        state.loading = false;
        state.currentEvent = null;
        state.error = action.payload?.message || 'Lỗi khi tải thông tin sự kiện';
      })
      .addCase(checkRegistrationStatus.pending, (state) => {
        state.registrationLoading = true;
      })
      .addCase(checkRegistrationStatus.fulfilled, (state, action) => {
        state.registrationLoading = false;
        console.log('Registration status updated:', action.payload);
        state.isRegistered = action.payload.isRegistered;
        state.registrationInfo = action.payload.registrationInfo;
      })
      .addCase(checkRegistrationStatus.rejected, (state) => {
        state.registrationLoading = false;
        state.isRegistered = false;
        state.registrationInfo = null;
      })
      .addCase(registerEvent.fulfilled, (state) => {
        state.isRegistered = true;
      })
      .addCase(cancelRegistration.fulfilled, (state) => {
        state.isRegistered = false;
        state.registrationInfo = null;
      });
  }
});

export const { setFilters, clearCurrentEvent, setRegistrationStatus } = eventSlice.actions;
export default eventSlice.reducer; 