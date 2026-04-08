function ErrorMessage({ message = 'Something went wrong.' }) {
  return (
    <div className="rounded-lg border border-rose-700 bg-rose-950/40 px-4 py-3 text-sm text-rose-300" role="alert">
      {message}
    </div>
  )
}

export default ErrorMessage
