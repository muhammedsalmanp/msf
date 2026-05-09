
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  isLogedin: false,
};

// Try to load saved state from localStorage
const loadSavedState = () => {
  try {
    const serialized = localStorage.getItem("userState");
    if (!serialized) return initialState;
    const parsed = JSON.parse(serialized);
    // Validate shape
    if (!parsed || typeof parsed !== "object") return initialState;
    return {
      user: parsed.user || null,
      accessToken: parsed.accessToken || null,
      isLogedin: parsed.isLogedin || false,
    };
  } catch (err) {
    console.error("Could not load user state from localStorage", err);
    return initialState;
  }
};

const savedState = loadSavedState();

const userSlice = createSlice({
  name: "user",
  initialState: savedState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isLogedin = true;

      const stateToSave = {
        user: state.user,
        accessToken: state.accessToken,
        isLogedin: state.isLogedin,
      };

      try {
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem("userState", serializedState);
      } catch (err) {
        console.error("Could not save user state to localStorage", err);
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isLogedin = false;
      try {
        localStorage.removeItem("userState");
      } catch (err) {
        console.error("Could not remove user state from localStorage", err);
      }
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
