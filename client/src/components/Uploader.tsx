import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { gql, useMutation } from "@apollo/client";
import Confirmation from "../components/Confirmation";
import Loading from "../pages/Loading";
import { useAppDispatch } from "../redux/store";
import { setServerError, setSuccess } from "../redux/slices/authSlice";
import { chunk } from "lodash";

const CREATE_CUSTOMER = gql`
  mutation createCustomer(
    $input: [CustomerData]
    $callfile: String
    $bucket: ID
  ) {
    createCustomer(input: $input, callfile: $callfile, bucket: $bucket) {
      success
      message
    }
  }
`;

type modalProps = {
  width: string;
  bucket: string | null;
  bucketRequired: (e: boolean) => void;
  onSuccess: () => void;
  canUpload: boolean;
  successUpload: () => void;
};

const Uploader: React.FC<modalProps> = ({
  width,
  bucket,
  bucketRequired,
  onSuccess,
  canUpload,
  successUpload,
}) => {
  const dispatch = useAppDispatch();
  const [excelData, setExcelData] = useState<Record<string, any>[]>([]);
  const [file, setFile] = useState<File[]>([]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setLoading(true);
      const { read, utils, SSF } = await import("xlsx");
      const reader = new FileReader();

      reader.onload = (e) => {
        const binaryString = e.target?.result;
        const workbook = read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonDataRaw = utils.sheet_to_json<Record<string, any>>(sheet, {
          defval: "",
          raw: true,
        });
        const jsonData = jsonDataRaw.map((row) => {
          const cleanRow: Record<string, any> = {};
          for (const key in row) {
            const cleanKey = key.trim().replace(/\s+/g, "_");
            cleanRow[cleanKey] = row[key];
          }
          return cleanRow;
        });

        const dateConverting = jsonData.map((row) => {
          const {
            interest_os,
            admin_fee_os,
            txn_fee_os,
            late_charge_os,
            penalty_interest_os,
            dst_fee_os,
            total_os,
            bill_due_date,
            contact_2,
            contact_3,
            contact,
            address,
            address_2,
            address_3,
            email,
            email_2,
            email_3,
            endorsement_date,
            birthday,
            grass_date,
            late_charge_waive_fee_os,
            emergencyContactMobile,
            case_id,
            dpd,
            platform_user_id,
            balance,
            max_dpd,
            principal_os,
            cf,
            pastdue_amount,
            mo_amort,
            writeoff_balance,
            overall_balance,
            mo_balance,
            batch_no,
            partial_payment_w_service_fee,
            new_tad_with_sf,
            new_pay_off,
            service_fee,
            gender,
            year,
            brand,
            model,
            last_payment_amount,
            last_payment_date,
            ...others
          } = row;

          function normalizePHNumber(contact: string) {
            if (!contact) return "";

            let cleaned = String(contact ?? "").replace(/[+\-\s()]/g, "");

            if (cleaned.includes("/")) {
              cleaned = cleaned?.split("/")[0];
            }

            if (/^(09\d{9})$/.test(cleaned)) {
              return cleaned;
            }

            if (/^639\d{9}$/.test(cleaned)) {
              return "0" + cleaned.slice(2);
            }

            if (/^\+639\d{9}$/.test(contact)) {
              return "0" + cleaned.slice(3);
            }

            if (/^0\d{1,2}\d{7}$/.test(cleaned)) {
              return cleaned;
            }

            if (/^63\d{1,2}\d{7}$/.test(cleaned)) {
              return "0" + cleaned.slice(2);
            }
            
            if (/^\+63\d{1,2}\d{7}$/.test(contact)) {
              return "0" + cleaned.slice(3);
            }

            return cleaned;
          }

          const safeDate = (date: string) => {
            try {
              return date ? SSF.format("yyyy-mm-dd", date) : undefined;
            } catch {
              return undefined;
            }
          };

          const rows = {
            ...others,
            contact: [],
            email: [],
            address: [],
            principal_os: isNaN(principal_os)
              ? isNaN(Number(total_os))
                ? 0
                : Number(total_os)
              : Number(principal_os) || Number(total_os),
            writeoff_balance: Number(writeoff_balance) || 0,

            cf: Number(cf) || 0,
            pastdue_amount: Number(pastdue_amount) || 0,
            interest_os: isNaN(interest_os) ? 0 : Number(interest_os) || 0,
            admin_fee_os: isNaN(admin_fee_os) ? 0 : Number(admin_fee_os) || 0,
            txn_fee_os: isNaN(txn_fee_os) ? 0 : Number(txn_fee_os) || 0,
            late_charge_os: isNaN(late_charge_os)
              ? 0
              : Number(late_charge_os) || 0,
            penalty_interest_os: isNaN(penalty_interest_os)
              ? 0
              : Number(penalty_interest_os) || 0,
            dst_fee_os: isNaN(dst_fee_os) ? 0 : Number(dst_fee_os) || 0,
            balance: Number(balance) || Number(total_os),
            total_os: Number(total_os) || Number(mo_amort),
            late_charge_waive_fee_os: Number(late_charge_waive_fee_os) || 0,
            overall_balance: Number(overall_balance) || 0,
            mo_balance: Number(mo_balance) || 0,
            partial_payment_w_service_fee:
              Number(partial_payment_w_service_fee) || 0,
            new_tad_with_sf: Number(new_tad_with_sf) || 0,
            new_pay_off: Number(new_pay_off) || 0,
            service_fee: Number(service_fee) || 0,
            last_payment_amount: Number(last_payment_amount) || 0,
            gender: isNaN(gender) ? gender : "O",
          } as Record<string, any>;

          if (emergencyContactMobile) {
            rows["emergencyContactMobile"] = normalizePHNumber(
              emergencyContactMobile
            ).toString();
          }

          if (model) {
            rows["model"] = model.toString().trim();
          }

          if (year) {
            rows["year"] = year.toString().trim();
          }

          if (brand) {
            rows["brand"] = brand.toString().trim();
          }

          if (platform_user_id) {
            rows["platform_user_id"] = platform_user_id.toString().trim();
          }

          if (case_id) {
            rows["case_id"] = String(case_id).trim().replace(/^-/, "");
          }
          if (!isNaN(Number(dpd))) {
            rows["dpd"] = Math.round(dpd);
          }

          if (!isNaN(Number(max_dpd))) {
            rows["max_dpd"] = Math.round(dpd);
          }

          if (grass_date) {
            rows["grass_date"] = safeDate(grass_date);
          }

          if (bill_due_date) {
            rows["bill_due_date"] = safeDate(bill_due_date);
          }
          if (last_payment_date) {
            rows["last_payment_date"] = safeDate(last_payment_date);
          }
          if (endorsement_date) {
            rows["endorsement_date"] = safeDate(endorsement_date);
          }
          if (birthday) {
            rows["birthday"] = safeDate(birthday);
          }

          if (contact) {
            const contactStr = String(contact);

            if (contactStr.includes("PHONE MOBILE1")) {
              const mobileMatches = contactStr.match(
                /PHONE MOBILE\d*\s*:\s*(\d{10,11})/g
              );

              if (mobileMatches) {
                mobileMatches.forEach((mob, index) => {
                  const numMatch = mob.match(/(\d{10,11})/);
                  if (numMatch) {
                    const normalized = normalizePHNumber(numMatch[0]);
                    if (index === 0) rows["contact"].push(normalized);
                    else if (index === 1) rows["contact"].push(normalized);
                    else if (index === 2) rows["contact"].push(normalized);
                  }
                });
              }
            } else {
              if (contact) {
                const newContact = normalizePHNumber(contact)
                  ?.toString()
                  ?.split(",");
                if (newContact.length > 1) {
                  newContact.map((nc) => rows["contact"].push(nc));
                } else {
                  rows["contact"].push(...newContact);
                }
              }

              if (contact_2) {
                const newContact = normalizePHNumber(String(contact_2))
                  ?.toString()
                  ?.split(",");
                if (newContact.length > 1) {
                  newContact.map((nc) => rows["contact"].push(nc));
                } else {
                  rows["contact"].push(...newContact);
                }
              }

              if (contact_3) {
                const newContact = normalizePHNumber(contact_3)
                  ?.toString()
                  ?.split(",");
                if (newContact.length > 1) {
                  newContact.map((nc) => rows["contact"].push(nc));
                } else {
                  rows["contact"].push(...newContact);
                }
              }
            }
          }

          if (address) {
            rows["address"].push(String(address));
          }

          if (address_2) {
            rows["address"].push(String(address_2));
          }

          if (address_3) {
            rows["address"].push(String(address_3));
          }

          if (email) {
            rows["email"].push(String(email));
          }

          if (email_2) {
            rows["email"].push(String(email_2));
          }

          if (email_3) {
            rows["email"].push(String(email_3));
          }

          if (batch_no) {
            rows["batch_no"] = String(batch_no).trim();
          }

          return {
            ...rows,
          };
        });
        setExcelData(dateConverting.slice(0, dateConverting.length));
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.log(error);
      dispatch(setServerError(true));
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "application/vnd.ms-excel": [],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles);
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  const [createCustomer] = useMutation(CREATE_CUSTOMER);

  const [confirm, setConfirm] = useState<boolean>(false);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "UPLOADED" | "LOGOUT",
    yes: () => {},
    no: () => {},
  });

  const [required, setRequired] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const creatingCustomer = useCallback(async () => {
    if (!excelData.length) return;
    const CHUNK_SIZE = 2000;
    const CONCURRENT_CHUNKS = 3;
    const chunks = chunk(excelData, CHUNK_SIZE);

    setLoading(true);

    const status: any[] = [];

    for (let i = 0; i < chunks.length; i += CONCURRENT_CHUNKS) {
      const batch = chunks.slice(i, i + CONCURRENT_CHUNKS);
      const promises = batch.map((chunkData) =>
        createCustomer({
          variables: {
            input: chunkData,
            callfile: file[0]?.name?.split(".")[0],
            bucket: bucket,
          },
        })
      );

      const results = await Promise.allSettled(promises);

      results.forEach((res) => {
        status.push(res);
      });
    }
          
    if (chunks.length === status.length) {
      if (
        status
          .map((x) =>
            x.status === "rejected"
              ? String(x.reason).includes("E11000")
              : false
          )
          .some((x) => x === true)
      ) {
        dispatch(
          setSuccess({
            success: true,
            message: "Duplicate file name",
            isMessage: false,
          })
        );
        setExcelData([]);
        setFile([]);
        setConfirm(false);
        setLoading(false);
      } else if (
        status
          .map((x) =>
            x.status === "rejected"
              ? String(x.reason).includes("Not Include")
              : false
          )
          .some((x) => x === true)
      ) {
        dispatch(
          setSuccess({
            success: true,
            message: "There is a buckets not included",
            isMessage: false,
          })
        );
        setLoading(false);
        setExcelData([]);
        setFile([]);
        setConfirm(false);
      } else {
        setConfirm(false);
        setExcelData([]);
        setFile([]);
        setRequired(false);
        bucketRequired(false);
        successUpload?.();
        onSuccess?.();
        setLoading(false);
      }
    }
  }, [
    createCustomer,
    excelData,
    file,
    setConfirm,
    bucket,
    setExcelData,
    setRequired,
    bucketRequired,
    successUpload,
    onSuccess,
    setLoading,
  ]);

  const submitUpload = () => {
    if (file.length === 0 || !bucket) {
      if (file.length === 0) {
        setRequired(true);
      } else {
        setRequired(false);
      }
      if (!bucket) {
        bucketRequired(true);
      } else {
        bucketRequired(false);
      }
    } else {
      bucketRequired(false);
      setRequired(false);
      setConfirm(true);
      setModalProps({
        message: "You uploaded a file?",
        toggle: "UPLOADED",
        yes: creatingCustomer,
        no: () => {
          setConfirm(false);
        },
      });
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      {canUpload && (
        <div className={`print:hidden  flex h-full gap-2 items-center ${width}`}>
          <div
            {...getRootProps()}
            className={`${
              required && file.length === 0 && "border-red-500 bg-red-50"
            } border bg-gray-200 shadow-md hover:shadow-none hover:bg-gray-100 transition-all border-dashed h-full rounded-md text-center cursor-pointer w-full flex items-center justify-center lg:text-xs 2xl:sm`}
          >
            <input {...getInputProps()} />
            {file.length === 0 && (
              <>
                {isDragActive ? (
                  <p className="text-blue-600">📂 Drop your files here...</p>
                ) : (
                  <p className="text-gray-600">
                    Drag & Drop file here or Click and select file
                  </p>
                )}
              </>
            )}
            {file.length > 0 && (
              <ul>
                {file.map((file) => (
                  <li key={file.name} className="text-green-600">
                    📄 {file.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="h-full" >
            <button
              type="button"
              className="bg-green-600 shadow-md border-2 h-full border-green-800 hover:bg-green-700 transition-all focus:outline-none text-white font-black uppercase rounded-md text-base px-6 py-1 cursor-pointer"
              onClick={submitUpload}
            >
             upload
            </button>
          </div>
        </div>
      )}

      {confirm && <Confirmation {...modalProps} />}
    </>
  );
};

export default Uploader;
