import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk actions
export const sendAIMessage = createAsyncThunk(
  'aiChat/sendMessage',
  async (message) => {
    const response = await axios.post('http://localhost:5001/api/ai/chat', { message });
    return response.data;
  }
);

export const fetchChatHistory = createAsyncThunk(
  'aiChat/fetchHistory',
  async () => {
    const response = await axios.get('http://localhost:5001/api/ai/chat/history');
    return response.data;
  }
);

const aiChatSlice = createSlice({
  name: 'aiChat',
  initialState: {
    chatHistory: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(sendAIMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendAIMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.chatHistory.push(action.payload);
      })
      .addCase(sendAIMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.chatHistory = action.payload;
      });
  }
});

export default aiChatSlice.reducer; 