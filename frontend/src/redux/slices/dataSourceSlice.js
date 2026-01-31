import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dataSources: [],
  loading: false,
  error: null
};

const dataSourceSlice = createSlice({
  name: 'dataSources',
  initialState,
  reducers: {
    setDataSources: (state, action) => {
      state.dataSources = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setDataSources, setLoading, setError } = dataSourceSlice.actions;
export default dataSourceSlice.reducer;