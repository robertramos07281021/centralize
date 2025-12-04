import gql from "graphql-tag";
import { Bucket } from "./TlDashboard";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useMutation } from "@apollo/client";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import {motion} from "framer-motion";

const MESSAGE_BUCKET = gql`
  mutation MessageBucket($id: ID!, $message: String) {
    messageBucket(id: $id, message: $message) {
      success
      message
    }
  }
`;

type Success = {
  success: boolean;
  message: string;
};
type ComponentProp = {
  bucket?: Bucket | null | undefined;
  closeModal: () => void;
};

export type MessageChildren = {
  divElement: HTMLDivElement | null;
};

const MessageModal = forwardRef<MessageChildren, ComponentProp>(
  ({ bucket, closeModal }, ref) => {
    const dispatch = useAppDispatch();
    const [messageBucket] = useMutation<{ messageBucket: Success }>(
      MESSAGE_BUCKET,
      {
        onCompleted: () => {
          closeModal();
          dispatch(
            setSuccess({
              success: false,
              message: "",
              isMessage: true,
            })
          );
          setMessage("");
        },
        onError: () => {
          dispatch(setServerError(true));
        },
      }
    );

    const [message, setMessage] = useState<string>("");

    const sendMessage = useCallback(async () => {
      await messageBucket({ variables: { id: bucket?._id, message: message } });
    }, [messageBucket, message, bucket]);

    const messageRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      divElement: messageRef.current,
    }));

    return (
      <motion.div
        className="absolute bottom-4 bg-gray-100 right-14 w-[30%] border rounded-md border-black p-2 flex flex-col"
        ref={messageRef}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-lg font-black uppercase ">Message</h1>
        <textarea
          name="message"
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full outline-none text-sm bg-white border h-full rounded-md border-black p-2"
        ></textarea>
        <div className="flex justify-end mt-2">
          <button
            className=" px-3 py-1 text-sm rounded-md font-black uppercase text-white bg-blue-600 cursor-pointer border-2 border-blue-800 hover:bg-blue-700"
            onClick={sendMessage}
          >
            Submit
          </button>
        </div>
      </motion.div>
    );
  }
);

export default MessageModal;
