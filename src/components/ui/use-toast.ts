import * as React from "react"

type Toast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  props?: any
}

type ToastState = {
  toasts: Toast[]
}

const toastState: ToastState = {
  toasts: []
}

let listeners: ((state: ToastState) => void)[] = []

function notify() {
  listeners.forEach(listener => listener(toastState))
}

export const useToast = () => {
  const [, setState] = React.useState(toastState)
  
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter(l => l !== setState)
    }
  }, [])
  
  const toast = React.useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    toastState.toasts = [...toastState.toasts, { id, ...props }]
    notify()
    return id
  }, [])
  
  const dismiss = React.useCallback((id?: string) => {
    if (id) {
      toastState.toasts = toastState.toasts.filter(t => t.id !== id)
    } else {
      toastState.toasts = []
    }
    notify()
  }, [])

  return { toast, dismiss, toasts: toastState.toasts }
}
