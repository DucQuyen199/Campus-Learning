/*-----------------------------------------------------------------
* File: assignmentApi.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
    
    getAssignmentSubmissions: builder.query({
      query: (assignmentId) => `assignments/${assignmentId}/submissions`,
      providesTags: (result, error, assignmentId) => [
        { type: 'AssignmentSubmission', id: assignmentId },
        { type: 'AssignmentSubmission', id: 'LIST' },
      ],
    }),
    
    createAssignment: builder.mutation({
      query: (data) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('courseId', data.courseId);
        formData.append('dueDate', data.dueDate || '');
        formData.append('totalPoints', data.totalPoints || 100);
        
        if (data.files && data.files.length > 0) {
          for (let i = 0; i < data.files.length; i++) {
            formData.append('files', data.files[i]);
          }
        }
        
        return {
          url: 'assignments',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: [{ type: 'Assignment', id: 'LIST' }],
    }),
    
    updateAssignment: builder.mutation({
      query: (data) => {
        const { assignmentId, ...rest } = data;
        const formData = new FormData();
        
        formData.append('title', rest.title);
        formData.append('description', rest.description || '');
        formData.append('courseId', rest.courseId);
        formData.append('dueDate', rest.dueDate || '');
        formData.append('totalPoints', rest.totalPoints || 100);
        
        if (rest.files && rest.files.length > 0) {
          for (let i = 0; i < rest.files.length; i++) {
            formData.append('files', rest.files[i]);
          }
        }
        
        return {
          url: `assignments/${assignmentId}`,
          method: 'PUT',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { assignmentId }) => [
        { type: 'Assignment', id: assignmentId },
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
    
    assignToStudents: builder.mutation({
      query: (data) => ({
        url: `assignments/${data.assignmentId}/assign`,
        method: 'POST',
        body: {
          courseId: data.courseId,
          dueDate: data.dueDate,
        },
      }),
      invalidatesTags: (result, error, { assignmentId }) => [
        { type: 'Assignment', id: assignmentId },
        { type: 'AssignmentSubmission', id: 'LIST' },
      ],
    }),
    
    gradeSubmission: builder.mutation({
      query: (data) => ({
        url: `assignments/submissions/${data.submissionId}/grade`,
        method: 'POST',
        body: {
          score: data.score,
          feedback: data.feedback,
        },
      }),
      invalidatesTags: (result, error, { submissionId }) => [
        { type: 'AssignmentSubmission', id: submissionId },
        { type: 'AssignmentSubmission', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAssignmentsQuery,
  useGetAssignmentByIdQuery,
  useGetAssignmentSubmissionsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useAssignToStudentsMutation,
  useGradeSubmissionMutation,
} = assignmentApi; 
