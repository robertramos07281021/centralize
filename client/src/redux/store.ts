import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, PersistConfig } from "redux-persist";
import { combineReducers } from "redux";
import CryptoJS from 'crypto-js'
import authReducer from "./slices/authSlice"
import { useDispatch } from "react-redux";
import type { WebStorage } from "redux-persist";

const rootReducer = combineReducers({
  auth: authReducer
});

const secretKey = import.meta.env.VITE_CRYPTO_KEY ?? ""

const encryptor: WebStorage = {
  setItem: (key: string, value: string): Promise<void> => {
const encrypted = CryptoJS.AES.encrypt(value, secretKey).toString();
    localStorage.setItem(key, encrypted)
    return Promise.resolve()
  },
  getItem: (key: string): Promise<string | null> => {
    const item = localStorage.getItem(key)
    if (!item) return Promise.resolve(null)
    try {
      const bytes = CryptoJS.AES.decrypt(item, secretKey)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      return Promise.resolve(decrypted)
    } catch (err) {
      console.error('Decryption error:', err)
      return Promise.resolve(null)
    }
  },
  removeItem: (key: string): Promise<void> => {
    localStorage.removeItem(key)
    return Promise.resolve()
  },
}

const persistConfig:PersistConfig<RootState>  = {
  key: "root",
  storage: encryptor,
  version: 1
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({serializableCheck: {
      ignoredActions: [
        "persist/PERSIST",
        "persist/REHYDRATE",
        "persist/PURGE",
      ],
    }}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
type AppDispatch = typeof store.dispatch;

export const useAppDispatch = ()=> useDispatch<AppDispatch>()