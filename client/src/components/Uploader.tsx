/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { gql, useMutation } from "@apollo/client";
import Confirmation from "../components/Confirmation";
import SuccessToast from "./SuccessToast";

interface Success {
  success: boolean;
  message: string;
}

interface Data {
  address: string
  admin_fee_os: number
  bill_due_day:number 
  birthday:string 
  endorsement_date: number
  grass_date: number 
  bucket:string
  case_id: number 
  one: string 
  platform_user_id:string
  credit_user_id:string
  customer_name:string 
  dpd_grp:string
  dst_fee_os:number
  email:string
  gender:string
  grass_region:string 
  interest_os:number
  late_charge_os:number
  max_dpd:number
  penalty_interest_os:number 
  principal_os:number
  scenario:string
  tagging:string 
  total_os:number
  txn_fee_os:number
  vendor_endorsement:string
}

const CREATE_CUSTOMER = gql `mutation
  createCustomer($input:[CustomerData], $callfile:String!) {
    createCustomer(input:$input, callfile:$callfile ) {
      success
      message
    }
  }
`

const Uploader = () => {
  const [success, setSuccess] = useState<Success>({
    success: false,
    message: ""
  })

  const [excelData, setExcelData] = useState<Data[]>([]);
  const [file, setFile] = useState<File[]>([]);
 
  // console.log(excelData)
  const handleFileUpload = useCallback(async(file: File) => {
    try {
      const { read, utils, SSF } = await import("xlsx");
      const reader = new FileReader();

      reader.onload = (e) => {
        const binaryString = e.target?.result;
        const workbook = read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0]; 
        const sheet = workbook.Sheets[sheetName];
  
        const jsonData:Data[] = utils.sheet_to_json(sheet); 

        const dateConverting = jsonData.map((row: any) => ({
          ...row,
          birthday: SSF.format("yyyy-mm-dd", row.birthday),
          endorsement_date:  SSF.format("yyyy-mm-dd", row.endorsement_date),
          grass_date:SSF.format("yyyy-mm-dd", row.grass_date),
          case_id: String(row.case_id),
          one: String(row.one),
          platform_user_id: String(row.platform_user_id),
          platform_user_id_1: String(row.platform_user_id_1),
        }));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const newJsonData = dateConverting.map(({ total_os_1, platform_user_id_1, ...rest }) => rest)
        setExcelData(newJsonData.slice(0,newJsonData.length - 1)); 
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.log(error)
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], 
      "application/vnd.ms-excel": [], 
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles)
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });
  
  const [createCustomer, ] = useMutation(CREATE_CUSTOMER, {
    onCompleted: async() => {
      setSuccess({
        success: true,
        message: "File successfully uploaded"
      })
      setExcelData([])
      setFile([])
    },
    onError: (error)=> {
      if(error.message.includes('E11000')) {
        setSuccess({
          success: true,
          message: "Duplicate file name"
        })
        setExcelData([])
        setFile([])
      }
    }
  })
  const [confirm, setConfirm] = useState(false)



  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "UPLOADED" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })

  const [required, setRequired] = useState(false)
  
  const submitUpload = () => {
    if(file.length === 0) {
      setRequired(true)
    } else {
      setRequired(false)
      setConfirm(true)
      setModalProps({
        message: "You uploaded a file?",
        toggle: "UPLOADED",
        yes: async() => {
          try {
            await createCustomer({variables: {input:excelData, callfile: file[0].name.split('.')[0]}});
            setConfirm(false);
          } catch (error:any) {
            const errorMessage = error?.graphQLErrors?.[0]?.message;
            if (errorMessage?.includes("Not Included")) {
              setSuccess({
                success: true,
                message: "There is a buckets not included"
              })
              setExcelData([])
              setFile([])
              setConfirm(false)
            }
          }
        },
        no: () => {setConfirm(false)}
      })
    }
  }

  return (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
      <div className="print:hidden flex gap-2 items-center w-4/12">
        <div {...getRootProps()} className={`${required && file.length === 0  && "border-red-500 bg-red-50"} border-2 border-dashed p-2 rounded-lg text-center cursor-pointer w-full flex items-center justify-center`}>
          <input {...getInputProps()} />
          {
            file.length === 0 &&
            <>
              {isDragActive ? (
                <p className="text-blue-600">📂 Drop your files here...</p>
              ) : ( 
                <p className="text-gray-600">Drag & Drop files here or Click to select</p>
              )}
            </>
          }
          {
            file.length > 0 && (
              <ul >
                {file.map((file) => (
                  <li key={file.name} className="text-green-600">
                    📄 {file.name}
                  </li>
                ))}
              </ul>
            )
          }
        </div>
        <div>
          <button type="button" className='bg-green-400 hover:bg-green-500 focus:outline-none text-white  focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 cursor-pointer'
          onClick={submitUpload}
          >Import</button>
        </div>
      </div>

      { confirm &&
        <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default Uploader
