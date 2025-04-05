/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";

import { useMutation } from "@apollo/client";
import { CREATE_CUSTOMER } from "../apollo/mutations";
import Confirmation from "../components/Confirmation";
import { CustomerData, ExcelFile, Success } from "../middleware/types";
import SuccessToast from "./SuccessToast";


const Uploader:React.FC = () => {
    const [success, setSuccess] = useState<Success>({
      success: false,
      message: ""
    })

    const [excelData, setExcelData] = useState<CustomerData[]>([]);
    const [file, setFile] = useState<File[]>([])
  
    const handleFileUpload = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryString = e.target?.result;
        const workbook = XLSX.read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0]; 
        const sheet = workbook.Sheets[sheetName];
  
        const jsonData:ExcelFile[] = XLSX.utils.sheet_to_json(sheet); 
        const dateConverting = jsonData.map((row: any) => ({
          ...row,
          birthday: XLSX.SSF.format("yyyy-mm-dd", row.birthday),
          endorsement_date:  XLSX.SSF.format("yyyy-mm-dd", row.endorsement_date),
          grass_date:XLSX.SSF.format("yyyy-mm-dd", row.grass_date),
          case_id: String(row.case_id),
          one: String(row.one),
          platform_user_id: String(row.platform_user_id),
          platform_user_id_1: String(row.platform_user_id_1)
        }));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const newJsonData = dateConverting.map(({ total_os_1, platform_user_id_1, ...rest }) => rest)
        setExcelData(newJsonData.slice(1,newJsonData.length -1)); 
      };
  
      reader.readAsBinaryString(file);
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
  
    const [createCustomer] = useMutation(CREATE_CUSTOMER, {
      onCompleted: async() => {
        try {
          setSuccess({
            success: true,
            message: "File successfully uploaded"
          })
          setExcelData([])
          setFile([])
        } catch (error) {
          console.log(error)
        }
      },
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
            await createCustomer({variables: {input:excelData}});
            setConfirm(false);
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
      <div className="print:hidden">
        <div {...getRootProps()} className={`${required && file.length === 0  && "border-red-500 bg-red-50"} border-2 border-dashed p-6 rounded-lg text-center cursor-pointer w-96 h-50 flex items-center justify-center`}>
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
              <ul className="mt-4">
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
        <button type="button" className='bg-green-400 hover:bg-green-500 focus:outline-none text-white  focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer'
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
