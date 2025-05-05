import { apiSlice } from './apiSlice';

export const assignmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAssignments: builder.query({
      query: (params) => ({
        url: 'assignments',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.assignments.map(({ AssignmentID }) => ({
                type: 'Assignment',
                id: AssignmentID,
              })),
              { type: 'Assignment', id: 'LIST' },
            ]
          : [{ type: 'Assignment', id: 'LIST' }],
    }),
    
    getAssignmentById: builder.query({
      query: (id) => `assignments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Assignment', id }],
    }),
    
    createAssignment: builder.mutation({
      query: (data) => ({
        url: 'assignments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Assignment', id: 'LIST' }],
    }),
    
    updateAssignment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `assignments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Assignment', id },
        { type: 'Assignment', id: 'LIST' },
      ],
    }),
    
    deleteAssignment: builder.mutation({
      query: (id) => ({
        url: `assignments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Assignment', id: 'LIST' }],
    }),
    
    gradeSubmission: builder.mutation({
      query: ({ submissionId, ...data }) => ({
        url: `assignments/submissions/${submissionId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { submissionId, assignmentId }) => [
        { type: 'Assignment', id: assignmentId },
      ],
    }),
  }),
});

export const {
  useGetAssignmentsQuery,
  useGetAssignmentByIdQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGradeSubmissionMutation,
} = assignmentApi; 