import { createSlice, PayloadAction  } from "@reduxjs/toolkit";
import { IntervalsTypes, Search } from "../../middleware/types";
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
  targets: Targets
  isOnline: boolean
  vici_id: string
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

type Success = {
  success: boolean,
  message: string
  isMessage: boolean
}

export type Targets = {
  daily: number
  weekly: number
  monthly: number
}

type UserState = {
  serverError: boolean
  userLogged: User | null
  search: search
  page: number
  selectedCustomer: Search | null
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
  success: Success
  selectedCampaign: string | null
  intervalTypes: IntervalsTypes
  selectedBucket: string | null
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
  success: {
    success: false,
    message: "",
    isMessage: false
  },
  breakValue: BreakEnum.WELCOME,
  userLogged: null,
  search: {
    fullName: "",
    contact_no: "",
    dob: "",
    email: ""
  },
  selectedCustomer: null,
  selectedCampaign: null,
  intervalTypes: IntervalsTypes.DAILY,
  selectedBucket: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setServerError: (state, action: PayloadAction<boolean>) => {
      state.serverError = action.payload
    },
    setUserLogged: (state, action: PayloadAction<User | null>) => {
      state.userLogged = action.payload
    },
    setSearch: (state, action:PayloadAction<search>) => {
      state.search = action.payload
    },
    setSelectedCustomer: (state, action:PayloadAction<Search | null>) => {
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
      state.selectedCustomer = null
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
    setLogout: () => initialState,
    setSuccess: (state, action:PayloadAction<Success>) => {
      state.success = action.payload
    },
    setSelectedCampaign: (state, action:PayloadAction<string | null>)=> {
      state.selectedCampaign = action.payload
    },
    setIntervalTypes: (state,action:PayloadAction<IntervalsTypes>)=> {
      state.intervalTypes = action.payload
    },
    setSelectedBucket: (state, action: PayloadAction<string | null>) => {
      state.selectedBucket = action.payload
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
  setMyToken,
  setSuccess,
  setSelectedCampaign,
  setIntervalTypes,
  setSelectedBucket
} = authSlice.actions;
export default authSlice.reducer;
