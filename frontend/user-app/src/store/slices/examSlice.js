/*-----------------------------------------------------------------
* File: examSlice.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  exams: [],
  currentExam: null,
  questions: [],
  currentQuestion: null,
  answers: {},
  results: null,
  isLoading: false,
  error: null,
  examInProgress: false,
  examStartTime: null,
  examEndTime: null,
  timeRemaining: 0,
  userExams: [],
  stateVersion: 0
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setExams: (state, action) => {
      state.exams = action.payload;
      state.isLoading = false;
      state.stateVersion++;
    },
    setCurrentExam: (state, action) => {
      state.currentExam = action.payload;
      state.isLoading = false;
      state.stateVersion++;
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
      state.isLoading = false;
      state.stateVersion++;
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
      state.stateVersion++;
    },
    saveAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      state.answers = {
        ...state.answers,
        [questionId]: answer
      };
      state.stateVersion++;
    },
    startExam: (state, action) => {
      const { exam, startTime, endTime, timeRemaining } = action.payload;
      state.currentExam = exam;
      state.examInProgress = true;
      state.examStartTime = startTime;
      state.examEndTime = endTime;
      
      // Use provided timeRemaining if available, otherwise calculate from endTime
      if (timeRemaining !== undefined) {
        state.timeRemaining = timeRemaining;
      } else if (endTime) {
        state.timeRemaining = Math.floor((new Date(endTime) - new Date()) / 1000);
      } else if (exam.Duration) {
        // Fallback to exam duration in minutes converted to seconds
        state.timeRemaining = exam.Duration * 60;
      }
      
      state.isLoading = false;
      state.stateVersion++;
    },
    updateTimeRemaining: (state, action) => {
      state.timeRemaining = action.payload;
    },
    endExam: (state) => {
      state.examInProgress = false;
      state.examStartTime = null;
      state.examEndTime = null;
      state.timeRemaining = 0;
      state.stateVersion++;
    },
    setResults: (state, action) => {
      state.results = action.payload;
      state.isLoading = false;
      state.stateVersion++;
    },
    setUserExams: (state, action) => {
      console.log("setUserExams reducer called with payload:", action.payload);
      
      // Handle different API response formats
      let examsData = null;
      
      if (Array.isArray(action.payload)) {
        // Direct array of exams
        examsData = action.payload;
        console.log("Received direct array of exams, length:", examsData.length);
      } else if (action.payload && action.payload.exams && Array.isArray(action.payload.exams)) {
        // Nested exams property (from API format)
        examsData = action.payload.exams;
        console.log("Extracted exams from nested property, length:", examsData.length);
      } else if (typeof action.payload === 'object' && action.payload !== null) {
        // Convert object to array if not in expected format
        console.warn("Unexpected payload format. Converting to array:", action.payload);
        examsData = Object.values(action.payload);
      } else {
        console.error("Invalid payload format for setUserExams:", action.payload);
        examsData = [];
      }
      
      // Always create a new array to ensure component re-renders
      state.userExams = [...examsData];
      
      // Debug the first few items to verify structure
      if (state.userExams.length > 0) {
        console.log("First exam in state:", state.userExams[0]);
        console.log("Total exams loaded:", state.userExams.length);
      } else {
        console.warn("No exams found in data");
      }
      
      // Update other state properties
      state.isLoading = false;
      state.stateVersion++; // Increment version to trigger re-renders
    },
    resetExamState: (state) => {
      state.currentExam = null;
      state.questions = [];
      state.currentQuestion = null;
      state.answers = {};
      state.results = null;
      state.examInProgress = false;
      state.examStartTime = null;
      state.examEndTime = null;
      state.timeRemaining = 0;
      state.stateVersion++;
    }
  }
});

export const {
  setLoading,
  setError,
  setExams,
  setCurrentExam,
  setQuestions,
  setCurrentQuestion,
  saveAnswer,
  startExam,
  updateTimeRemaining,
  endExam,
  setResults,
  setUserExams,
  resetExamState
} = examSlice.actions;

export default examSlice.reducer; 
