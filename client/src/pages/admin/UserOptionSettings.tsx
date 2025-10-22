type modalProps = {
  Submit: (
    action: "RESET" | "STATUS" | "UNLOCK" | "LOGOUT",
    status: boolean
  ) => void;
  check: boolean;
  isLock: boolean;
  isOnline: boolean;
};

const UserOptionSettings: React.FC<modalProps> = ({
  Submit,
  check,
  isLock,
  isOnline,
}) => {
  return (
    <div className="flex flex-col py-6 gap-2 pr-5">
      <div>
        <button
          type="button"
          className="bg-orange-500 w-full transition-all border-2 border-orange-800 font-black uppercase shadow-md hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 rounded-md text-sm px-5 py-2.5   cursor-pointer mt-5"
          onClick={() => Submit("RESET", false)}
        >
          Reset Password
        </button>
      </div>
      {isOnline && (
        <div>
          <button
            type="button"
            className="bg-red-500 w-full transition-all border-2 border-red-800 font-black uppercase shadow-md hover:bg-red-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 rounded-md text-sm px-5 py-2.5  cursor-pointer "
            onClick={() => Submit("LOGOUT", false)}
          >
            Logout
          </button>
        </div>
      )}
      
      <div>
        <label className="inline-flex border-2 border-blue-800 w-full shadow-md p-2 hover:bg-blue-300 rounded-md bg-blue-200 transition-all uppercase items-center cursor-pointer">
          <input
            type="checkbox"
            checked={check}
            id="activation"
            name="activation"
            onChange={(e) => Submit("STATUS", e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-black text-gray-900 dark:text-gray-300">
            {check ? "Activated" : "Deactivated"}
          </span>
        </label>
        {isLock && (
          <div>
            <button
              type="button"
              onClick={() => Submit("UNLOCK", false)}
              className="bg-red-600 hover:bg-red-700 focus:outline-none text-white focus:ring-4 focus:ring-red-400 font-black rounded-md text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5"
            >
              Unlock User
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOptionSettings;
