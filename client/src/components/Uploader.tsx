/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { gql, useMutation } from "@apollo/client";
import Confirmation from "../components/Confirmation";
import SuccessToast from "./SuccessToast";
import Loading from "../pages/Loading";

interface Success {
  success: boolean;
  message: string;
}

interface Data {
  address: string
  address_2: string
  address_3: string
  admin_fee_os: number
  bill_due_day:number 
  birthday:string 
  endorsement_date: number
  grass_date: number 
  case_id: number 
  contact: string
  contact_2: string
  contact_3: string
  platform_user_id:string
  credit_user_id:string
  customer_name:string 
  dpd_grp:string
  dst_fee_os:number
  email:string
  email_2:string
  email_3:string
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
  createCustomer($input:[CustomerData], $callfile:String!, $bucket: ID!) {
    createCustomer(input:$input, callfile:$callfile , bucket:$bucket) {
      success
      message
    }
  }
`
interface modalProps {
  width: string
  bucket: string
  bucketRequired: (e:boolean)=> void
  onSuccess: ()=> void
  canUpload: boolean
}

const Uploader:React.FC<modalProps> = ({width, bucket, bucketRequired,onSuccess,canUpload}) => {
  const [success, setSuccess] = useState<Success>({
    success: false,
    message: ""
  })
  

  const [excelData, setExcelData] = useState<Data[]>([]);
  const [file, setFile] = useState<File[]>([]);
 
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
          platform_user_id: String(row.platform_user_id),
        }))
        setExcelData(dateConverting.slice(0,dateConverting.length)); 
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
  
  const [createCustomer,{loading}] = useMutation(CREATE_CUSTOMER, {
    onCompleted: async() => {
      setSuccess({
        success: true,
        message: "File successfully uploaded"
      })
      setExcelData([])
      setFile([])
      onSuccess()
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
    if(file.length === 0 || !bucket) {

      if(file.length === 0) {
        setRequired(true)
      } else {
        setRequired(false)
      }

      if(!bucket) {
        bucketRequired(true)
      } else {
        bucketRequired(false)
      }

    } else {
      bucketRequired(false)
      setRequired(false)
      setConfirm(true)
      setModalProps({
        message: "You uploaded a file?",
        toggle: "UPLOADED",
        yes: async() => {
          try {
            await createCustomer({variables: {input:excelData, callfile: file[0].name.split('.')[0], bucket: bucket}});
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

  

  if(loading) return <Loading/>
  
  return (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
      {
        canUpload &&
        <div className={`print:hidden flex gap-2 items-center ${width}`}>
          <div {...getRootProps()} className={`${required && file.length === 0  && "border-red-500 bg-red-50"} border-2 border-dashed p-2 rounded-lg text-center cursor-pointer w-full flex items-center justify-center lg:text-xs 2xl:sm`}>
            <input {...getInputProps()} />
            {
              file.length === 0 &&
              <>
                {isDragActive ? (
                  <p className="text-blue-600">📂 Drop your files here...</p>
                ) : ( 
                  <p className="text-gray-600">Drag & Drop file here or Click and select file</p>
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
      }

      { confirm &&
        <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default Uploader
