import { createSlice, PayloadAction  } from "@reduxjs/toolkit";

type User = {
  _id: string,
  change_password: boolean,
  name: string,
  type: string,
  username: string,
  branch: string,
  department: string,
  bucket: string
}

type search = {
  fullName: string,
  contact_no: string,
  dob: string,
  email: string
}

interface UserState {
  error: boolean
  need_login: boolean
  page: number
  userLogged: User
  search: search

}

const initialState:UserState = {
  error: false,
  need_login: false,
  page: 1,
  userLogged: {
    _id: "",
    change_password: false,
    name: "",
    type: "",
    username: "",
    branch: "",
    department: "",
    bucket: ""
  },
  search: {
    fullName: "",
    contact_no: "",
    dob: "",
    email: ""
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.error = false
      state.need_login = false
    },
    setError: (state, action: PayloadAction<boolean>) => {
      state.error = action.payload
    },
    setNeedLogin: (state, action:PayloadAction<boolean> ) => {
      state.need_login = action.payload
    },
    setUserLogged: (state, action: PayloadAction<User>) => {
      state.userLogged = action.payload
    },
    setPage: (state, action:PayloadAction<number>) => {
      state.page = action.payload
    },
    setSearch: (state, action:PayloadAction<search>) => {
      state.search = action.payload
    }
  },
});

export const { logoutUser, setError, setNeedLogin , setUserLogged, setPage, setSearch} = authSlice.actions;
export default authSlice.reducer;
