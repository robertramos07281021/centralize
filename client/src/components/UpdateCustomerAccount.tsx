import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useState } from "react";
import Confirmation from "./Confirmation";
import { RootState, useAppDispatch } from "../redux/store";
import {
  setSelectedCustomer,
  setServerError,
  setSuccess,
} from "../redux/slices/authSlice";
import { useSelector } from "react-redux";
import { AccountUpdateHistory } from "../middleware/types";
import { motion, AnimatePresence } from "framer-motion";

type CustomerProps = {
  cancel: () => void;
};
type FormData = {
  total_os: string | null;
  principal: string | null;
  balance: string | null;
};

const UPDATE_ACCOUNT_INFO = gql`
  mutation updateCustomerAccount($input: CustomerAccountsInput) {
    updateCustomerAccount(input: $input) {
      success
      message
      customerAccount {
        balance
        out_standing_details {
          principal_os
          interest_os
          admin_fee_os
          txn_fee_os
          late_charge_os
          dst_fee_os
          waive_fee_os
          total_os
          writeoff_balance
          overall_balance
          cf
          mo_balance
          pastdue_amount
          mo_amort
          partial_payment_w_service_fee
          new_tad_with_sf
          new_pay_off
          service_fee
        }
        account_update_history {
          principal_os
          total_os
          balance
          updated_date
          updated_by
        }
      }
    }
  }
`;
type outStandingDetails = {
  principal_os: number;
  interest_os: number;
  admin_fee_os: number;
  txn_fee_os: number;
  late_charge_os: number;
  dst_fee_os: number;
  total_os: number;
  waive_fee_os: number;
  late_charge_waive_fee_os: number;
  writeoff_balance: number;
  overall_balance: number;
  cf: number;
  mo_balance: number;
  pastdue_amount: number;
  mo_amort: number;
  partial_payment_w_service_fee: number;
  new_tad_with_sf: number;
  new_pay_off: number;
  service_fee: number;
};

type CustomerAccount = {
  balance: number;
  out_standing_details: outStandingDetails;
  account_update_history: AccountUpdateHistory[];
};

type UpdatedCusterAccount = {
  success: boolean;
  message: string;
  customerAccount: CustomerAccount;
};

const UpdateCustomerAccount: React.FC<CustomerProps> = ({ cancel }) => {
  const { selectedCustomer } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState<FormData>({
    total_os: null,
    principal: null,
    balance: null,
  });

  const dispatch = useAppDispatch();
  const [updateCustomerAccount] = useMutation<{
    updateCustomerAccount: UpdatedCusterAccount;
  }>(UPDATE_ACCOUNT_INFO, {
    onCompleted: (data) => {
      dispatch(
        setSuccess({
          success: data.updateCustomerAccount.success,
          message: data.updateCustomerAccount.message,
          isMessage: false,
        })
      );
      if (selectedCustomer) {
        dispatch(
          setSelectedCustomer({
            ...selectedCustomer,
            balance: data.updateCustomerAccount.customerAccount.balance,
            out_standing_details:
              data.updateCustomerAccount.customerAccount.out_standing_details,
            account_update_history:
              data.updateCustomerAccount.customerAccount.account_update_history,
          })
        );
      }
      cancel();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const handleOnChangeAmount = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      toUpdate: keyof typeof formData
    ) => {
      let inputValue = e.target.value.replace(/[^0-9.]/g, "");
      const parts = inputValue.split(".");

      if (parts.length > 2) {
        inputValue = parts[0] + "." + parts[1];
      } else if (parts.length === 2) {
        inputValue = parts[0] + "." + parts[1].slice(0, 2);
      }

      const forUpdate: { [key: string]: string } = {};

      if (inputValue.startsWith("0") && !inputValue.startsWith("0.")) {
        inputValue = inputValue.replace(/^0+/, "");
        if (inputValue === "") inputValue = "0";
      }

      forUpdate[toUpdate] = inputValue;
      setFormData((prev) => ({ ...prev, ...forUpdate }));
    },
    [setFormData]
  );

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "UPDATE" as "UPDATE",
    yes: () => {},
    no: () => {},
  });
  const [confirm, setConfirm] = useState<boolean>(false);

  const onSubmit = useCallback(() => {
    setConfirm((prev) => !prev);
    setModalProps({
      message: "Are you sure you want to update this account?",
      toggle: "UPDATE",
      yes: async () => {
        await updateCustomerAccount({
          variables: {
            input: {
              id: selectedCustomer?._id,
              total_os: Number(formData.total_os),
              principal_os: Number(formData.principal),
              balance: Number(formData.balance),
            },
          },
        });
        setConfirm((prev) => !prev);
      },
      no: () => {
        setConfirm((prev) => !prev);
      },
    });
  }, [setModalProps, setConfirm, updateCustomerAccount, formData]);

  return (
    <AnimatePresence>
      <div className="absolute top-0 left-0 w-full h-full justify-center items-center flex">
        <motion.div
          onClick={() => cancel()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className=" cursor-pointer z-30 absolute top-0 left-0 backdrop-blur-sm w-full h-full "
        ></motion.div>
        <motion.fieldset
          className="flex flex-col gap-5 border border-black shadow-md z-30 rounded-md overflow-hidden bg-white"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
        >
          <div className="w-full py-3 border-b border-black text-2xl text-center bg-gray-300 rounded-t-md font-black uppercase text-gray-600">
            For Update
          </div>
          <div className="flex gap-2 lg:gap-2 2xl:gap-10 px-10 items-end 2xl:text-base text-xs lg:text-sm flex-col 2xl:flex-row justify-start">
            <label className="flex items-center gap-2">
              <p className="font-black uppercase text-gray-600">
                Outstanding Balance :
              </p>
              <input
                type="text"
                id="total_os"
                name="total_os"
                value={formData.total_os || ""}
                className="border rounded-lg p-2 border-black shadow-md"
                onChange={(e) => handleOnChangeAmount(e, "total_os")}
              />
            </label>
            <label className="flex items-center gap-2">
              <p className="font-black uppercase text-gray-600">
                Principal Balance :
              </p>
              <input
                type="text"
                className="border rounded-lg p-2 border-black shadow-md"
                value={formData.principal || ""}
                onChange={(e) => handleOnChangeAmount(e, "principal")}
              />
            </label>
            <label className="flex items-center gap-2">
              <p className="font-black uppercase text-gray-600">Balance :</p>
              <input
                type="text"
                value={formData.balance || ""}
                className="border rounded-lg p-2 border-black shadow-md"
                onChange={(e) => handleOnChangeAmount(e, "balance")}
              />
            </label>
          </div>
          <div className="flex gap-2 items-center justify-center pb-5">
            <button
              className="py-2.5 hover:bg-orange-600 border-2 border-orange-800 font-black uppercase bg-orange-500 transition-all rounded-lg text-sm cursor-pointer w-22 text-white"
              onClick={onSubmit}
            >
              Save
            </button>
            <button
              className="py-2.5 hover:bg-gray-600 border-2 transition-all border-gray-800 bg-gray-500 font-black uppercase rounded-lg text-sm cursor-pointer w-22 text-white"
              onClick={() => cancel()}
            >
              Cancel
            </button>
          </div>
        </motion.fieldset>

        {confirm && <Confirmation {...modalProps} />}
      </div>
    </AnimatePresence>
  );
};

export default UpdateCustomerAccount;
