import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage"; // Defaults to localStorage
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";

import authReducer from "./slices/authSlice"
import { useDispatch } from "react-redux";

const rootReducer = combineReducers({
  auth: authReducer
});

const persistConfig = {
  key: "root",
  storage,
  version: 1
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({serializableCheck: {
      ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
    }}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
type AppDispatch = typeof store.dispatch;

export const useAppDispatch = ()=> useDispatch<AppDispatch>()