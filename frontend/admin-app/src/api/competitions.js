import adminApi from './config';

// Competitions API endpoints
export const competitionsAPI = {
  // Get all competitions
  getCompetitions: async () => {
    try {
      const response = await adminApi.get('/competitions');
      return response.data;
    } catch (error) {
      console.error('Error fetching competitions:', error);
      return { competitions: [] };
    }
  },
  
  // Get competition by ID
  getCompetition: async (id) => {
    try {
      const response = await adminApi.get(`/competitions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching competition ${id}:`, error);
      throw error;
    }
  },
  
  // Create competition
  createCompetition: async (competitionData) => {
    try {
      const response = await adminApi.post('/competitions', competitionData);
      return response.data;
    } catch (error) {
      console.error('Error creating competition:', error);
      throw error;
    }
  },
  
  // Update competition
  updateCompetition: async (id, competitionData) => {
    try {
      const response = await adminApi.put(`/competitions/${id}`, competitionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating competition ${id}:`, error);
      throw error;
    }
  },
  
  // Delete competition
  deleteCompetition: async (id) => {
    try {
      const response = await adminApi.delete(`/competitions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting competition ${id}:`, error);
      throw error;
    }
  },
  
  // Update competition status
  updateCompetitionStatus: async (id, status) => {
    try {
      const response = await adminApi.put(`/competitions/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating competition ${id} status:`, error);
      throw error;
    }
  },
  
  // Get competition problems
  getProblems: async (competitionId) => {
    try {
      const response = await adminApi.get(`/competitions/${competitionId}/problems`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching problems for competition ${competitionId}:`, error);
      return { problems: [] };
    }
  },
  
  // Get a specific problem
  getProblem: async (competitionId, problemId) => {
    try {
      const response = await adminApi.get(`/competitions/${competitionId}/problems/${problemId}`);
      
      // Check if response structure is correct
      if (!response.data.problem && response.data) {
        // If the API returns directly the problem data without wrapping in a 'problem' property
        return { 
          success: true,
          problem: response.data 
        };
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching problem ${problemId}:`, error);
      throw error;
    }
  },
  
  // Create problem for competition
  createProblem: async (competitionId, problemData) => {
    try {
      const response = await adminApi.post(`/competitions/${competitionId}/problems`, problemData);
      return response.data;
    } catch (error) {
      console.error(`Error creating problem for competition ${competitionId}:`, error);
      throw error;
    }
  },
  
  // Update a problem
  updateProblem: async (competitionId, problemId, problemData) => {
    try {
      const response = await adminApi.put(`/competitions/${competitionId}/problems/${problemId}`, problemData);
      return response.data;
    } catch (error) {
      console.error(`Error updating problem ${problemId}:`, error);
      throw error;
    }
  },
  
  // Delete a problem
  deleteProblem: async (competitionId, problemId) => {
    try {
      const response = await adminApi.delete(`/competitions/${competitionId}/problems/${problemId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting problem ${problemId}:`, error);
      throw error;
    }
  },
  
  // Get competition participants
  getCompetitionParticipants: async (competitionId) => {
    try {
      const response = await adminApi.get(`/competitions/${competitionId}/participants`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching participants for competition ${competitionId}:`, error);
      return { participants: [] };
    }
  }
};

export default competitionsAPI; 