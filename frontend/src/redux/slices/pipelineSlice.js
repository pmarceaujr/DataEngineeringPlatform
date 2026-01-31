import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pipelines: [],
  currentPipeline: null,
  loading: false,
  error: null
};

const pipelineSlice = createSlice({
  name: 'pipelines',
  initialState,
  reducers: {
    setPipelines: (state, action) => {
      state.pipelines = action.payload;
    },
    setCurrentPipeline: (state, action) => {
      state.currentPipeline = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setPipelines, setCurrentPipeline, setLoading, setError } = pipelineSlice.actions;
export default pipelineSlice.reducer;