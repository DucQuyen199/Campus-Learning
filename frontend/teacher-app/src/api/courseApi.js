import { apiSlice } from './apiSlice';

export const courseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query({
      query: (params) => ({
        url: 'courses',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.courses.map(({ CourseID }) => ({ type: 'Course', id: CourseID })),
              { type: 'Course', id: 'LIST' },
            ]
          : [{ type: 'Course', id: 'LIST' }],
    }),
    
    getCourseById: builder.query({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Course', id }],
    }),
    
    createModule: builder.mutation({
      query: ({ courseId, ...data }) => ({
        url: `courses/${courseId}/modules`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Course', id: courseId },
      ],
    }),
    
    updateModule: builder.mutation({
      query: ({ moduleId, ...data }) => ({
        url: `courses/modules/${moduleId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { moduleId }) => [
        { type: 'Course', id: 'LIST' },
      ],
    }),
    
    createLesson: builder.mutation({
      query: ({ moduleId, ...data }) => ({
        url: `courses/modules/${moduleId}/lessons`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Course', id: 'LIST' }],
    }),
    
    updateLesson: builder.mutation({
      query: ({ lessonId, ...data }) => ({
        url: `courses/lessons/${lessonId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: [{ type: 'Course', id: 'LIST' }],
    }),
    
    getCourseEnrollments: builder.query({
      query: ({ courseId, ...params }) => ({
        url: `courses/${courseId}/enrollments`,
        params,
      }),
      providesTags: (result, error, { courseId }) => [
        { type: 'Course', id: `${courseId}-ENROLLMENTS` },
      ],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseByIdQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useGetCourseEnrollmentsQuery,
} = courseApi; 