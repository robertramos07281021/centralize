import { createSlice, PayloadAction  } from "@reduxjs/toolkit";
import { Search } from "../../middleware/types";

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
  userLogged: User
  search: search
  selectedCustomer:Search
}

const initialState:UserState = {
  error: false,
  need_login: false,
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
  },
  selectedCustomer: {
    _id: "",
    case_id: "",
    account_id: "",
    endorsement_date: "",
    credit_customer_id: "",
    bill_due_day: 0,
    max_dpd: 0,
    balance: 0,
    paid_amount: 0,
    out_standing_details: {
      principal_os: 0,
      interest_os: 0,
      admin_fee_os: 0,
      txn_fee_os: 0,
      late_charge_os: 0,
      dst_fee_os: 0,
      total_os: 0
    },
    grass_details: {
      grass_region: "",
      vendor_endorsement: "",
      grass_date: ""
    },
    account_bucket: {
      name: "",
      dept: ""
    },
    customer_info: {
      fullName:"",
      dob:"",
      gender:"",
      contact_no:[],
      emails:[],
      addresses:[],
      _id:""
    }
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
    setSearch: (state, action:PayloadAction<search>) => {
      state.search = action.payload
    },
    setSelectedCustomer: (state, action:PayloadAction<Search>) => {
      state.selectedCustomer = action.payload
    }
  },
});

export const { logoutUser, setError, setNeedLogin , setUserLogged, setSearch, setSelectedCustomer} = authSlice.actions;
export default authSlice.reducer;
