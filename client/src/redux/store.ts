
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";
import CryptoJS from "crypto-js";
import authReducer from "./slices/authSlice";
import { useDispatch } from "react-redux";
import type { PersistConfig, WebStorage } from "redux-persist";


const rootReducer = combineReducers({
  auth: authReducer,
});

const secretKey = import.meta.env.VITE_CRYPTO_KEY ?? "";

const defaultState = {
  auth: authReducer(undefined, { type: "@@INIT" }), // initial auth state
};

const encryptor: WebStorage = {
  setItem: (key: string, value: string): Promise<void> => {
    try {
      const encrypted = CryptoJS.AES.encrypt(value, secretKey).toString();
      localStorage.setItem(key, encrypted);
    } catch (err) {
      console.error("Encryption error:", err);
    }
    return Promise.resolve();
  },
  getItem: (key: string): Promise<string | null> => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return Promise.resolve(JSON.stringify(defaultState));
      const bytes = CryptoJS.AES.decrypt(item, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) return Promise.resolve(JSON.stringify(defaultState));
      return Promise.resolve(decrypted);
    } catch (err) {
      console.error("Decryption error:", err);
      localStorage.removeItem(key); // auto-clear broken data
      return Promise.resolve(JSON.stringify(defaultState));
    }
  },
  removeItem: (key: string): Promise<void> => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};




const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: "root",
  storage: encryptor,
  // stateReconciler: hardSet,
  version: 1,
  // migrate: async (state: any) => {
  //   // fallback: if state is null (deleted), return default state
  //   return state || {};
  // },
  whitelist: ["auth"], // only persist auth slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);


export type RootState = ReturnType<typeof rootReducer>;
type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
