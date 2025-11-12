import gql from "graphql-tag"
import { Bucket } from "./TlDashboard"
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react"
import { useMutation } from "@apollo/client"
import { useAppDispatch } from "../../redux/store"
import { setServerError, setSuccess } from "../../redux/slices/authSlice"

const MESSAGE_BUCKET = gql`
  mutation MessageBucket($id: ID!, $message: String) {
    messageBucket(id: $id, message: $message) {
      success
      message
    }
  }
`

type Success = {
  success: boolean
  message: string
}
type ComponentProp = {
  bucket?: Bucket | null | undefined
  closeModal: () => void
}

export type MessageChildren = {
  divElement: HTMLDivElement | null
}

const MessageModal=forwardRef<MessageChildren, ComponentProp> (
  ({bucket, closeModal},ref) => {
  const dispatch = useAppDispatch()
  const [messageBucket] = useMutation<{messageBucket:Success}>(MESSAGE_BUCKET,{
    onCompleted: () => {
      closeModal()
      dispatch(setSuccess({
        success: false,
        message: "",
        isMessage: true
      }))
      setMessage("")
    },
    onError: () => {
     dispatch(setServerError(true)) 
    }
  })

  const [message, setMessage] = useState<string>('')

  const sendMessage = useCallback(async()=>{ 
    await messageBucket({variables: {id: bucket?._id, message: message}})
  },[messageBucket,message,bucket])

  const messageRef = useRef<HTMLDivElement | null>(null)

  useImperativeHandle(ref, () => ({
    divElement: messageRef.current,
  }))



  return (
    <div className='p-2 absolute bottom-5 right-20 h-70 w-96 flex flex-col border gap-2 bg-white rounded-xl border-slate-500' ref={messageRef}>
      <h1 className='text-lg font-medium '>Message</h1>
      <textarea 
        name="message" 
        id="message" 
        value={message}
        onChange={(e)=> setMessage(e.target.value)}
        className="w-full border h-full rounded-md border-slate-500 p-2"></textarea>
      <div className="flex justify-end mt-2">
        <button className="border px-2 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-800" onClick={sendMessage}>Submit</button>
      </div>
    </div>
  )
})

export default MessageModal