import clsx from "clsx";

export function Button(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
) {
  return (
    <button
      {...props}
      className={clsx(
        "font-lato",
        "inline-block min-w-[8rem] border bg-subcomms-neutral-200 px-8 py-1 text-lg transition-colors",
        "text-subcomms-black",
        "active:translate-x-0 active:translate-y-0 active:shadow-none",
        !props.disabled
          ? "-translate-x-0.5 -translate-y-0.5 border-subcomms-black shadow-button shadow-subcomms-black hover:bg-subcomms-sky"
          : "border-subcomms-gray2 opacity-60",
        props.className,
      )}
    />
  );
}

export function ButtonSmall(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
) {
  return (
    <button
      {...props}
      className={clsx(
        props.className,
        "font-lato text-base",
        "inline-block min-w-[6rem] border bg-subcomms-neutral-100 px-2 py-1 transition-colors",
        "border-subcomms-black text-subcomms-black",
        "active:translate-x-0 active:translate-y-0",
        "shadow-button shadow-subcomms-black",
        !props.disabled ? "-translate-x-0.5 -translate-y-0.5 " : "opacity-60",
        !props.disabled && "hover:bg-subcomms-neutral-200",
      )}
    />
  );
}

export function ButtonSecondary(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
) {
  return (
    <button
      {...props}
      className={clsx(
        props.className,
        "font-forum",
        "min-w-[4rem] rounded border border-subcomms-neutral-200 px-4 py-1 text-sm transition-colors",
        props.disabled ? "opacity-60" : "hover:bg-subcomms-sky",
      )}
    />
  );
}
