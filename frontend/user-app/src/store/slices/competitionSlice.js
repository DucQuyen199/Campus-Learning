import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { competitionServices } from '@/services/api';

export const fetchActiveCompetitions = createAsyncThunk(
  'competitions/fetchActive',
  async (filters) => {
    const response = await competitionServices.getAllCompetitions(filters);
    return response.data;
  }
);

export const fetchCompetitions = createAsyncThunk(
  'competitions/fetchAll',
  async () => {
    const response = await competitionServices.getAllCompetitions();
    return response.data;
  }
);

export const joinCompetition = createAsyncThunk(
  'competitions/join',
  async (competitionId) => {
    const response = await competitionServices.joinCompetition(competitionId);
    return response.data;
  }
);

const competitionSlice = createSlice({
  name: 'competitions',
  initialState: {
    competitions: [],
    currentCompetition: null,
    participants: [],
    submissions: [],
    loading: false,
    error: null
  },
  reducers: {
    updateParticipantStatus: (state, action) => {
      const { participantId, status } = action.payload;
      const participant = state.participants.find(p => p.id === participantId);
      if (participant) {
        participant.status = status;
      }
    },
    addSubmission: (state, action) => {
      state.submissions.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveCompetitions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveCompetitions.fulfilled, (state, action) => {
        state.loading = false;
        state.competitions = action.payload;
        state.error = null;
      })
      .addCase(fetchActiveCompetitions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchCompetitions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompetitions.fulfilled, (state, action) => {
        state.loading = false;
        state.competitions = action.payload;
        state.error = null;
      })
      .addCase(fetchCompetitions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { updateParticipantStatus, addSubmission } = competitionSlice.actions;
export default competitionSlice.reducer; 