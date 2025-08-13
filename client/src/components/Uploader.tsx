import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { gql, useMutation } from "@apollo/client";
import Confirmation from "../components/Confirmation";
import Loading from "../pages/Loading";
import { useAppDispatch } from "../redux/store";
import { setServerError, setSuccess } from "../redux/slices/authSlice";

type Data = {
  address: string
  address_2: string
  address_3: string
  admin_fee_os: number
  bill_due_date:string 
  birthday:string 
  endorsement_date: number
  grass_date: number 
  case_id: string
  contact: string
  contact_2: string
  contact_3: string
  platform_user_id:string
  credit_user_id:string
  customer_name:string 
  dpd_grp:string
  dst_fee_os:number
  balance: number
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
  collectorID: string
  txn_fee_os:number
  late_charge_waive_fee_os: number
  vendor_endorsement:string
  emergencyContactName: string
  emergencyContactMobile: string
  dpd: number
  mpd: number
}

const CREATE_CUSTOMER = gql `mutation
  createCustomer($input:[CustomerData], $callfile:String!, $bucket: ID!) {
    createCustomer(input:$input, callfile:$callfile , bucket:$bucket) {
      success
      message
    }
  }
`

type modalProps = {
  width: string
  bucket: string
  bucketRequired: (e:boolean)=> void
  onSuccess: ()=> void
  canUpload: boolean
  successUpload: () => void
}

const Uploader:React.FC<modalProps> = ({width, bucket, bucketRequired,onSuccess,canUpload, successUpload}) => {
  const dispatch = useAppDispatch()
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
        const dateConverting = jsonData.map((row: Data) => {
          const { 
            interest_os, 
            admin_fee_os, 
            txn_fee_os, 
            late_charge_os, 
            penalty_interest_os, 
            dst_fee_os, total_os, 
            bill_due_date, 
            contact_2, 
            contact_3, 
            contact, 
            endorsement_date, 
            birthday,
            grass_date,
            dpd,
            mpd,
            max_dpd,
            late_charge_waive_fee_os,
            emergencyContactMobile,
            case_id,
            platform_user_id,
            balance
          } = row

          function normalizeContact(contact:string) {
            const cleaned = contact.toString().trim().replace(/[+\-\s()]/g, '');
            const metroManila = /^2\d{7,8}$/;
            const fiveDigitAreaCodes = /^(8822|8842)\d{5}$/;
            const provincialLandline = /^(3[2-8]|4[2-9]|5[2-6]|6[2-8]|7[2-8]|8[2-8])\d{7}$/;
            const mobile = /^9\d{9}$/;
            const mobileWithSTZ = /^630\d{10}$/;
            const mobileWithST = /^63\d{10}$/;

            if (mobileWithSTZ.test(cleaned)) {
              return '0' + cleaned.slice(3);
            }

            if (mobileWithST.test(cleaned)) {
              return '0' + cleaned.slice(2);
            }

            if (mobile.test(cleaned)) {
              return '0' + cleaned;
            }

            if (metroManila.test(cleaned)) {
              return '0' + cleaned;
            }

            if (fiveDigitAreaCodes.test(cleaned)) {
              return '0' + cleaned;
            }

            if (provincialLandline.test(cleaned)) {
              return '0' + cleaned;
            }
            return cleaned;
          }

          const safeDate = (date: any) => {
            try {
              return date ? SSF.format("yyyy-mm-dd", date) : undefined;
            } catch {
              return undefined;
            }
          };

          const rows:Data = {
            ...row,
            interest_os: Number(interest_os) || 0,
            admin_fee_os: Number(admin_fee_os) || 0,
            txn_fee_os: Number(txn_fee_os) || 0,
            late_charge_os: Number(late_charge_os) || 0,
            penalty_interest_os: Number(penalty_interest_os) || 0,
            dst_fee_os: Number(dst_fee_os) || 0,
            balance: Number(balance) || 0,
            total_os: Number(total_os) || 0,
            contact: contact ? normalizeContact(contact).toString().trim() : "",
            max_dpd: Number.isFinite(dpd) ? Math.ceil(dpd) : Math.ceil(max_dpd) || 0,
            mpd: Math.ceil(mpd) || 0,
            late_charge_waive_fee_os: Number(late_charge_waive_fee_os) || 0,
          }
          
          if(emergencyContactMobile) {
            rows['emergencyContactMobile'] = normalizeContact(emergencyContactMobile)
          }
          if(platform_user_id) {
            rows['platform_user_id'] = platform_user_id.toString().trim()
          }

          if(case_id) {
            rows['case_id'] = case_id.toString().trim()
          }

          if(grass_date) {
            rows['grass_date'] = safeDate(grass_date)
          }

          if(bill_due_date) {
            rows['bill_due_date'] = safeDate(bill_due_date)
          }

          if(endorsement_date) {
            rows['endorsement_date'] = safeDate(endorsement_date)
          }

          if(birthday) {
            rows['birthday'] = safeDate(birthday)
          }

          if(contact_2) {
            rows['contact_2'] = normalizeContact(contact_2).toString().trim()
          }

          if(contact_3) {
            rows['contact_3'] = normalizeContact(contact_3).toString().trim()
          }
          return {
          ...rows
          }
        })

        setExcelData(dateConverting.slice(0,dateConverting.length)); 
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      dispatch(setServerError(true))
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
    onCompleted:() => {
      successUpload()
      setExcelData([])
      setFile([])
      onSuccess()
    },
    onError: (error)=> {
    console.log(error)
    const errorMessage = error.message;
    if (errorMessage?.includes("Not Included")) {
      dispatch(setSuccess({
        success: true,
        message: "There is a buckets not included"
      }))
      setExcelData([])
      setFile([])
      setConfirm(false)
    } else if(errorMessage.includes('E11000')) {
      dispatch(setSuccess({
        success: true,
        message: "Duplicate file name"
      }))
      setExcelData([])
      setFile([])
    } 
    else {
      dispatch(setServerError(true))
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
  
  const creatingCustomer = useCallback(async()=> {
    await createCustomer({variables: {input:excelData, callfile: file[0].name.split('.')[0], bucket: bucket}});
    setConfirm(false)
  },[createCustomer, excelData, file, setConfirm, bucket])

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
        yes: creatingCustomer,
        no: () => {setConfirm(false)}
      })
    }
  }

  if(loading) return <Loading/>
  
  return (
    <>
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
