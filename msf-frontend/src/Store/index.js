import { configureStore } from "@reduxjs/toolkit";
import userReducer from '../Store/slices/userSlice';
import loadingReducer from '../Store/slices/loadingSlice'; 
import notificationReducer from '../Store/slices/notificationSlice'

const loadUserState = () => {
  try {
    const serializedState = localStorage.getItem('userState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load user state from localStorage", err);
    return undefined;
  }
};

const saveUserState = (state) => {
  try {
    const serializedState = JSON.stringify(state.user);
    localStorage.setItem('userState', serializedState);
  } catch (err) {
    console.error("Could not save user state to localStorage", err);
  }
};

const persistedUserState = loadUserState();

const store = configureStore({
    reducer:{
        user: userReducer,
        loading: loadingReducer,
        notification: notificationReducer,
    },
    preloadedState: {
      user: persistedUserState
    }
});

store.subscribe(() => {
  saveUserState(store.getState());
});

export default store;