type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`border border-2 border-gray-700 rounded-xl px-5 py-3 ${className ?? ""}`}
    />
  );
}
