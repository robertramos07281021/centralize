import {
  MdKeyboardDoubleArrowLeft,
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardDoubleArrowRight,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import React from "react";

type modalProps = {
  value: string;
  onChangeValue: (e: string) => void;
  onKeyDownValue: (e: number) => void;
  totalPage: number;
  currentPage: number;
};

const Pagination: React.FC<modalProps> = ({
  value,
  onChangeValue,
  onKeyDownValue,
  totalPage,
  currentPage,
}) => {
  return (
    <div className="flex justify-end p-2 select-none">
      <div className="flex items-center gap-2 lg:text-[0.6em] 2xl:text-[0.6em] font-bold text-gray-600">
        <MdKeyboardDoubleArrowLeft
          className={`text-lg  ${
            currentPage === 1
              ? "text-slate-300 "
              : "text-slate-500 cursor-pointer hover:bg-blue-300"
          } `}
          onClick={() => {
            if (currentPage <= totalPage) {
              onKeyDownValue(1);
            }
          }}
        />
        <MdOutlineKeyboardArrowLeft
          className={`text-lg ${
            currentPage === 1
              ? "text-slate-300"
              : "text-slate-500 cursor-pointer hover:bg-blue-300"
          } `}
          onClick={() => {
            if (currentPage > 1) {
              onKeyDownValue(currentPage - 1);
            }
          }}
        />
        <p>Page</p>
        <input
          type="text"
          name="page"
          id="page"
          autoComplete="off"
          maxLength={3}
          value={value}
          onChange={(e) => {
            let setValue = e.target.value;
            setValue = e.target.value.replace(/[^0-9.]/g, "");
            const result = setValue === "0" ? "1" : setValue;
            onChangeValue(result);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const check =
                totalPage <= parseInt(value) ? totalPage : parseInt(value);
              const newValue =
                value === "" || value === "0" ? currentPage : check;
              onKeyDownValue(newValue);
            }
          }}
          className="border max-w-8  py-0.5 px-1.5 rounded-md focus:outline-0 "
        />
        <span>of {totalPage}</span>
        <MdOutlineKeyboardArrowRight
          className={`text-lg ${
            currentPage === totalPage
              ? "text-slate-300"
              : "text-slate-500 cursor-pointer hover:bg-blue-300"
          } `}
          onClick={() => {
            if (totalPage > currentPage) {
              onKeyDownValue(currentPage + 1);
            }
          }}
        />
        <MdOutlineKeyboardDoubleArrowRight
          className={`text-lg ${
            currentPage === totalPage
              ? "text-slate-300"
              : "text-slate-500 cursor-pointer hover:bg-blue-300"
          } `}
          onClick={() => {
            if (totalPage >= currentPage) {
              onKeyDownValue(totalPage);
            }
          }}
        />
      </div>
    </div>
  );
};

export default Pagination;
