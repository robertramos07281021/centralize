import viciImage from "../images/vicidial_on_dial.png";
import ccsSearch from "../images/search.png";
import dispositionPanel from "../images/dispositionPanel.png";

type Props = {
  close: () => void;
};

const Helper: React.FC<Props> = ({ close }) => {
  return (
    <div className="absolute top-0 left-0 h-full w-full p-5 border z-50 flex overflow-hidden">
      <div className="h-full w-full rounded-md bg-white border relative flex flex-col overflow-hidden p-5">
        <button
          className="absolute top-5 right-5 border rounded-full w-8 h-8 text-xl flex items-center justify-center cursor-pointer bg-red-500 text-white border-red-500"
          onClick={() => close()}
        >
          X
        </button>

        <h1 className="text-5xl font-medium mb-5">Helper</h1>
        <div className=" h-full w-full ps-5 pt-5 overflow-auto">
          <p className="font-bold">How to used Search Button</p>
          <div className="flex flex-col">
            <p className="indent-5">
              &#9679; Make sure there is an active call in{" "}
              <strong>Vicidial</strong>, either via <strong>Manual</strong>, or{" "}
              <strong>Auto</strong>.
            </p>
            <div className="items-center justify-center flex">
              <img src={viciImage} alt="Vicidial Image" className="ms-5 mt-5" />
            </div>
          </div>
          <div className="mt-5 flex flex-col">
            <p className="indent-5 mt-5">
              &#9679; Click <strong>Search</strong>. If the customer account
              isn’t found, ask your TL to check if another agent has already
              claimed it or their is an error to your account need to fixed, your vicidial id registered on CCS.
            </p>
            <div className="flex items-center justify-center">
            <img src={ccsSearch} alt="CCS search Image" className="ms-5 mt-5" />

            </div>
          </div>

          <div className="mt-5 flex flex-col">
            <p className="mt-5 font-bold">How To Used Customer Disposition</p>
            <p className="indent-5">
              &#9679; First, select the <strong>Contact Method</strong> and{" "}
              <strong>Disposition</strong> before the <strong>Submit</strong>{" "}
              button becomes available.
            </p>
            <div className=" flex items-center justify-center">
              <img
                src={dispositionPanel}
                alt="Disposition Panel Image"
                className="ms-5 mt-5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Helper;
