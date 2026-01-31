/**
 * Redux Store Configuration
 * Central state management for the entire app
 * 
 *     - Redux Concepts Explained:
        - Slice: A piece of your Redux state (auth, pipelines, etc.)
        - Actions: Things that can happen (login, logout, etc.)
        - Reducers: Functions that update state based on actions
        - Thunks: Async actions (like API calls)
        - State: The actual data stored
    - Flow:
        - Component calls dispatch(login(credentials))
        - Thunk makes API call
        - If successful, reducer updates state with user data
        - Components re-render with new state
 * 
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dataSourceReducer from './slices/dataSourceSlice';
import pipelineReducer from './slices/pipelineSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    dataSources: dataSourceReducer,
    pipelines: pipelineReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false  // Disable for non-serializable values (like functions)
    })
});

export default store;