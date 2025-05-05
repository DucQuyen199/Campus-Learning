import axios from 'axios';
import adminApi from './config';

const API_URL = '/exams';

// Get all exams
export const getAllExams = async () => {
  try {
    const response = await adminApi.get(API_URL);
    console.log('Raw API response:', response.data);
    
    // Đảm bảo response.data là array
    const exams = Array.isArray(response.data) ? response.data : [];
    
    return {
      exams: exams,
      total: exams.length
    };
  } catch (error) {
    console.error('Error in getAllExams:', error);
    throw error;
  }
};

// Get exam by ID
export const getExamById = async (id) => {
  try {
    const response = await adminApi.get(`${API_URL}/${id}`);
    
    // Cố gắng lấy câu hỏi, nếu lỗi thì vẫn trả về dữ liệu bài thi
    try {
      const questionsResponse = await adminApi.get(`${API_URL}/${id}/questions`);
      return {
        ...response.data,
        questions: questionsResponse.data || []
      };
    } catch (error) {
      console.warn('Không thể lấy câu hỏi từ API, có thể API chưa được triển khai:', error.message);
      // Vẫn trả về dữ liệu bài thi, nhưng với mảng câu hỏi rỗng
      return {
        ...response.data,
        questions: []
      };
    }
  } catch (error) {
    console.error('Error fetching exam details:', error);
    throw error;
  }
};

// Get exam questions
export const getExamQuestions = async (examId) => {
  try {
    const response = await adminApi.get(`${API_URL}/${examId}/questions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    // Trả về mảng rỗng thay vì ném lỗi
    return [];
  }
};

// Create a new exam
export const createExam = async (examData) => {
  try {
    console.log('Creating exam with data:', JSON.stringify(examData));
    const response = await adminApi.post(API_URL, examData);
    console.log('Server response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error creating exam:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};

// Update an exam
export const updateExam = async (id, examData) => {
  try {
    const response = await adminApi.put(`${API_URL}/${id}`, examData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete an exam
export const deleteExam = async (id) => {
  try {
    const response = await adminApi.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add question to exam
export const addQuestionToExam = async (examId, questionData) => {
  try {
    const response = await adminApi.post(
      `${API_URL}/${examId}/questions`,
      questionData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update question
export const updateQuestion = async (questionId, questionData) => {
  try {
    const response = await adminApi.put(
      `${API_URL}/questions/${questionId}`,
      questionData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete question
export const deleteQuestion = async (questionId) => {
  try {
    const response = await adminApi.delete(
      `${API_URL}/questions/${questionId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add answer template for essay exam
export const addAnswerTemplate = async (examId, templateData) => {
  try {
    const response = await adminApi.post(
      `${API_URL}/${examId}/template`,
      templateData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add coding exercise to an exam question
export const addCodingExercise = async (examId, questionId, exerciseData) => {
  try {
    const response = await adminApi.post(
      `${API_URL}/${examId}/questions/${questionId}/coding`,
      exerciseData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Upload file for essay exam
export const uploadEssayFile = async (examId, questionId, formData) => {
  try {
    const response = await adminApi.post(
      `${API_URL}/${examId}/questions/${questionId}/essay/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add essay content/template for a question
export const addEssayContent = async (examId, questionId, essayData) => {
  try {
    const { content, keywords, minimumMatchPercentage } = essayData;
    const response = await adminApi.post(
      `/exams/${examId}/questions/${questionId}/essay`,
      {
        templateText: content, // Map content to templateText
        keywords: keywords,
        scoringCriteria: JSON.stringify({
          minimumMatchPercentage,
          keywords
        })
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get essay question template
export const getEssayTemplate = async (questionId) => {
  try {
    const response = await adminApi.get(
      `${API_URL}/questions/${questionId}/essay`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Grade an essay answer
export const gradeEssayAnswer = async (examId, participantId, questionId, answer) => {
  try {
    const response = await adminApi.post(
      `${API_URL}/${examId}/participants/${participantId}/questions/${questionId}/grade-essay`,
      { answer }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get coding exam testcases
export const getExamTestcases = async (examId) => {
  try {
    const response = await adminApi.get(`${API_URL}/${examId}/testcases`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exam testcases:', error);
    throw error;
  }
};

// Get exam participants (students taking the exam)
export const getExamParticipants = async (examId) => {
  try {
    // Sử dụng endpoint có sẵn - có thể cần điều chỉnh nếu backend có endpoint khác
    const response = await adminApi.get(`${API_URL}/${examId}/participants`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exam participants:', error);
    // Không hiển thị lỗi trong console khi gặp lỗi 404
    return [];
  }
}; 