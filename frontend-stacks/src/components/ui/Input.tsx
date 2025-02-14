import clsx from "clsx";

export function Input({
  small,
  ...props
}: React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement> & { small?: boolean },
  HTMLInputElement
>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-40 border border-none bg-subcomms-neutral-100 outline-none transition-colors",
        small ? "px-4 py-2" : "rounded-md px-4 py-4",
        props.disabled && "border-subcomms-neutral-100",
        props.className,
      )}
    />
  );
}
