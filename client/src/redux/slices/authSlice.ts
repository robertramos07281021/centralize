import { createSlice, PayloadAction  } from "@reduxjs/toolkit";
import { Search } from "../../middleware/types";
import { BreakEnum } from "../../middleware/exports";

type User = {
  _id: string,
  change_password: boolean,
  name: string,
  type: string,
  username: string,
  branch: string,
  departments: string[],
  buckets: string[]
  account_type: string
  group: string
}

type search = {
  fullName: string,
  contact_no: string,
  dob: string,
  email: string
}

export enum Tasker {
  group = "group",
  individual = "individual"
}

export enum TaskFilter {
  assigned = "assigned",
  unassigned = "unassigned"
}

type UserState = {
  serverError: boolean
  userLogged: User
  search: search
  page: number
  selectedCustomer:Search
  selectedGroup: string
  selectedAgent: string
  tasker: Tasker
  taskFilter: TaskFilter
  selectedDisposition: string[] 
  limit: number
  productionManagerPage: number
  breakValue: keyof typeof BreakEnum
  breakTimer: number
  start: string
  agentRecordingPage: number
  adminUsersPage: number,
  myToken: string | null
}

const initialState:UserState = {
  serverError: false,
  myToken: null,
  selectedGroup: "",
  selectedAgent: "",
  page: 1,
  tasker: Tasker.group,
  taskFilter: TaskFilter.assigned,
  selectedDisposition: [] as string[],
  limit: 20,
  agentRecordingPage: 1,
  productionManagerPage: 1,
  breakTimer: 0,
  start: "",
  adminUsersPage: 1,
  breakValue: BreakEnum.WELCOME,
  userLogged: {
    _id: "",
    change_password: false,
    name: "",
    type: "",
    username: "",
    branch:"",
    departments: [],
    buckets: [],
    account_type: "",
    group: ""
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
      _id:"",
      isRPC: false
    }
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setServerError: (state, action: PayloadAction<boolean>) => {
      state.serverError = action.payload
    },
    setUserLogged: (state, action: PayloadAction<User>) => {
      state.userLogged = action.payload
    },
    setSearch: (state, action:PayloadAction<search>) => {
      state.search = action.payload
    },
    setSelectedCustomer: (state, action:PayloadAction<Search>) => {
      state.selectedCustomer = action.payload
    },
    setSelectedGroup: (state, action:PayloadAction<string>)=> {
      state.selectedGroup = action.payload
    },
    setAgent: (state, action:PayloadAction<string>) => {
      state.selectedAgent = action.payload
    },
    setPage: (state, action:PayloadAction<number>) => {
      state.page = action.payload
    },
    setTasker: (state, action:PayloadAction<string>) => { 
      state.tasker = action.payload as Tasker
    },
    setTaskFilter: (state, action:PayloadAction<string>) => {
      state.taskFilter = action.payload as TaskFilter
    },
    setSelectedDisposition: (state, action:PayloadAction<string[]>) => {
      state.selectedDisposition = action.payload 
    },
    setProductionManagerPage: (state, action:PayloadAction<number>) => {
      state.productionManagerPage = action.payload
    },
    setAgentRecordingPage: (state, action:PayloadAction<number>) => {
      state.agentRecordingPage = action.payload
    },
    setBreakValue: (state, action:PayloadAction<keyof typeof BreakEnum>)=> {
      state.breakValue = action.payload
    },
    setMyToken: (state, action:PayloadAction<string>)=> {
      state.myToken = action.payload
    },
    setDeselectCustomer: (state) => {
      state.selectedCustomer = {
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
          _id:"",
          isRPC: false
        }
      }
    },
    increamentBreakTimer: (state) => {
      state.breakTimer ++;
    },
    setBreakTimer: (state,action:PayloadAction<number>)=> {
      state.breakTimer = action.payload;
    },
    setStart: (state, action:PayloadAction<string>)=> {
      state.start = action.payload
    },
    setAdminUsersPage: (state, action:PayloadAction<number>) => {
      state.adminUsersPage = action.payload
    },
    setLogout: (state) => {
      state.selectedCustomer = {
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
          _id:"",
          isRPC: false
        }
      }
      state.userLogged= {
        _id: "",
        change_password: false,
        name: "",
        type: "",
        username: "",
        branch:"",
        departments: [],
        buckets: [],
        account_type: "",
        group: ""
      }
      state.search= {
        fullName: "",
        contact_no: "",
        dob: "",
        email: ""
      }
      state.serverError = false
      state.selectedGroup = ""
      state.selectedAgent = ""
      state.page = 1
      state.tasker = Tasker.group
      state.taskFilter = TaskFilter.assigned
      state.selectedDisposition = [] 
      state.productionManagerPage = 1
      state.agentRecordingPage = 1
      state.breakTimer = 0
      state.start =  ""
      state.breakValue = BreakEnum.WELCOME
      state.adminUsersPage = 1
      state.myToken = null
    }
  },
});

export const { 
  setServerError,
  setUserLogged,
  setSearch,
  setSelectedCustomer,
  setSelectedGroup,
  setAgent,
  setPage,
  setTasker,
  setTaskFilter,
  setSelectedDisposition,
  setDeselectCustomer,
  setProductionManagerPage,
  setLogout,
  setBreakValue,
  increamentBreakTimer,
  setBreakTimer,
  setStart, 
  setAgentRecordingPage,
  setAdminUsersPage,
  setMyToken
} = authSlice.actions;
export default authSlice.reducer;
