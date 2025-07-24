/*-----------------------------------------------------------------
* File: courseSlice.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { courseServices } from '@/services/api';
import courseApi from '@/api/courseApi';

// Function to get cached courses
const getCachedCourses = () => {
  const cached = localStorage.getItem('enrolledCourses');
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      // Cache is valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    } catch (e) {
      // If parse fails, ignore cache
      console.warn('Failed to parse cached courses');
    }
  }
  return null;
};

// Function to cache courses
const cacheCourses = (courses) => {
  try {
    localStorage.setItem('enrolledCourses', JSON.stringify({
      data: courses,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to cache courses');
  }
};

export const fetchEnrolledCourses = createAsyncThunk(
  'course/fetchEnrolledCourses',
  async (options = {}, { dispatch, rejectWithValue, getState }) => {
    const { forceRefresh = false } = options;
    
    try {
      // Return cached courses immediately if available and not forcing refresh
      const cachedCourses = !forceRefresh && getCachedCourses();
      if (cachedCourses) {
        // Dispatch fulfilled to update Redux state, but continue fetching in background
        dispatch({ 
          type: 'course/fetchEnrolledCourses/fulfilled', 
          payload: cachedCourses 
        });
        
        // Only continue with API request if forceRefresh or in background
        if (!forceRefresh) {
          // Start background refresh after cache is used
          setTimeout(() => {
            dispatch(fetchEnrolledCourses({ forceRefresh: true }));
          }, 100);
          
          return cachedCourses;
        }
      }
    
      console.log('Fetching enrolled courses...');
      const response = await courseApi.getEnrolledCourses();
      
      // Log the response to debug
      console.log('Enrolled courses response:', response);
      
      if (response.data && response.data.success) {
        // Mark each course as enrolled for UI purposes
        let courses = response.data.data.map(course => ({
          ...course,
          enrolled: true
        }));
        
        // Loại bỏ khóa học trùng lặp theo ID
        const uniqueMap = new Map();
        courses.forEach(course => {
          const uniqueID = course.CourseID || course.id;
          if (uniqueID && !uniqueMap.has(uniqueID)) {
            uniqueMap.set(uniqueID, course);
          }
        });
        
        courses = Array.from(uniqueMap.values());
        
        // Cache the fetched courses
        cacheCourses(courses);
        
        return courses;
      } else {
        return rejectWithValue(response.data?.message || 'Không thể tải khóa học đã đăng ký');
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      return rejectWithValue(error.response?.data?.message || 'Đã xảy ra lỗi khi tải khóa học đã đăng ký');
    }
  }
);

// Preload all courses data
export const preloadAllCourses = createAsyncThunk(
  'course/preloadAllCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await courseApi.getAllCourses();
      
      if (response.data && response.data.success) {
        // Cache courses in localStorage for quick access
        localStorage.setItem('allCourses', JSON.stringify({
          data: response.data.data,
          timestamp: Date.now()
        }));
        
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Không thể tải danh sách khóa học');
      }
    } catch (error) {
      console.error('Error preloading all courses:', error);
      return rejectWithValue(error.response?.data?.message || 'Đã xảy ra lỗi khi tải danh sách khóa học');
    }
  }
);

export const enrollFreeCourse = createAsyncThunk(
  'courses/enrollFreeCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      // Gọi API đăng ký khóa học miễn phí
      // Phần phản hồi từ courseApi đã được parse thành JSON
      // nên chúng ta trả về trực tiếp đối tượng response để giữ nguyên
      // structure { success, message, data }
      const response = await courseApi.enrollFreeCourse(courseId);
      return response; // Trả về toàn bộ phản hồi thay vì response.data (vốn là undefined)
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Không thể đăng ký khóa học' });
    }
  }
);

const initialState = {
  enrolledCourses: [],
  allCourses: [],
  loading: false,
  error: null,
  enrollmentSuccess: false,
  dataLoaded: false
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearCourses: (state) => {
      state.enrolledCourses = [];
    },
    resetEnrollmentStatus: (state) => {
      state.enrollmentSuccess = false;
    },
    addEnrolledCourse: (state, action) => {
      // Chuẩn hóa dữ liệu khóa học
      const normalizedCourse = {
        ...action.payload,
        CourseID: action.payload.CourseID || action.payload.id || null,
        enrolled: true,
        // Đảm bảo có CourseType
        CourseType: action.payload.CourseType || action.payload.courseType || 
          ((action.payload.Title || action.payload.title || '').toLowerCase().includes('it') ? 'it' : 'regular')
      };
      
      // Kiểm tra xem khóa học đã tồn tại chưa bằng ID
      const courseExists = state.enrolledCourses.some(
        course => (course.CourseID === normalizedCourse.CourseID) || 
                  (course.id === normalizedCourse.CourseID) ||
                  (normalizedCourse.id && (course.CourseID === normalizedCourse.id || course.id === normalizedCourse.id))
      );
      
      if (!courseExists && normalizedCourse.CourseID) {
        console.log('Manually adding enrolled course to Redux store:', normalizedCourse);
        state.enrolledCourses.push(normalizedCourse);
        
        // Update the cache too
        const cachedCourses = getCachedCourses() || [];
        const notInCache = !cachedCourses.some(
          course => (course.CourseID === normalizedCourse.CourseID) || 
                    (course.id === normalizedCourse.CourseID) ||
                    (normalizedCourse.id && (course.CourseID === normalizedCourse.id || course.id === normalizedCourse.id))
        );
        
        if (notInCache) {
          cacheCourses([...cachedCourses, normalizedCourse]);
        }
      }
    },
    loadCachedAllCourses: (state) => {
      // Try to load from localStorage
      const cached = localStorage.getItem('allCourses');
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // Cache is valid for 30 minutes
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            state.allCourses = data;
            state.dataLoaded = true;
          }
        } catch (e) {
          // If parse fails, ignore cache
          console.warn('Failed to parse cached all courses');
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnrolledCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrolledCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.enrolledCourses = action.payload;
      })
      .addCase(fetchEnrolledCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(preloadAllCourses.pending, (state) => {
        // Don't set loading to true here to avoid UI flickering
      })
      .addCase(preloadAllCourses.fulfilled, (state, action) => {
        state.allCourses = action.payload;
        state.dataLoaded = true;
      })
      .addCase(preloadAllCourses.rejected, (state) => {
        // Don't set error state to avoid UI errors
      })
      .addCase(enrollFreeCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollFreeCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollmentSuccess = true;
        // Add the newly enrolled course to the list if returned in the payload
        if (action.payload && action.payload.course) {
          const newCourse = {
            ...action.payload.course,
            enrolled: true
          };
          
          // Kiểm tra trùng lặp trước khi thêm vào danh sách
          const courseExists = state.enrolledCourses.some(
            course => (course.CourseID === newCourse.CourseID || course.CourseID === newCourse.id) ||
                     (course.id === newCourse.CourseID || course.id === newCourse.id)
          );
          
          if (!courseExists) {
            state.enrolledCourses.push(newCourse);
            
            // Cập nhật cache
            const cachedCourses = getCachedCourses() || [];
            cacheCourses([...cachedCourses, newCourse]);
          }
        }
      })
      .addCase(enrollFreeCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Lỗi khi đăng ký khóa học';
      });
  }
});

export const { clearCourses, resetEnrollmentStatus, addEnrolledCourse, loadCachedAllCourses } = courseSlice.actions;
export default courseSlice.reducer; 
