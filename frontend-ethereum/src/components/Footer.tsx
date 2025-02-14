import clsx from "clsx";
import logoUrl from "../assets/images/submarine.svg";

export function Footer() {
  return (
    <div className="m-auto flex w-full max-w-5xl grow flex-col">
      <footer className="footer border-solid border-1 border-orange-500 mb-1 mt-2 flex items-center justify-between rounded-md bg-subcomms-neutral-0 p-4 text-sm text-subcomms-neutral-300">
        <p className="md:text-center">
          <img
            className="inline -translate-y-0.5"
            width="32px"
            height="24px"
            src={logoUrl}
          />
        </p>

        <p className="links flex w-full gap-4 md:w-1/3 md:justify-end">
          <a
            href="https://github.com/subcomms/subkey"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
  </div>
  );
}
