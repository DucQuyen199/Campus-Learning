import { apiSlice } from './apiSlice';

export const studentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query({
      query: (params) => ({
        url: 'students',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.students.map(({ UserID }) => ({ type: 'Student', id: UserID })),
              { type: 'Student', id: 'LIST' },
            ]
          : [{ type: 'Student', id: 'LIST' }],
    }),
    
    getStudentById: builder.query({
      query: (id) => `students/${id}`,
      providesTags: (result, error, id) => [{ type: 'Student', id }],
    }),
    
    issueWarning: builder.mutation({
      query: ({ studentId, ...data }) => ({
        url: `students/${studentId}/warnings`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { studentId }) => [
        { type: 'Student', id: studentId },
      ],
    }),
    
    updateWarningStatus: builder.mutation({
      query: ({ warningId, ...data }) => ({
        url: `students/warnings/${warningId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Student'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useIssueWarningMutation,
  useUpdateWarningStatusMutation,
} = studentApi; 