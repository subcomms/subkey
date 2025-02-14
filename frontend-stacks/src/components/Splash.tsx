import { Link } from 'react-router-dom'
import { showConnect } from "@stacks/connect";

import { Button } from "./ui/Button";
import { userSession } from "../stacks/auth";
import iconUrl from "../assets/images/submarine.svg";
import splashUrl from "../assets/images/submarine2.svg";
import clsx from "clsx";

const leatherURL = 'https://leather.io/';
const xverseURL = 'https://www.xverse.app/';

export function Splash() {
  function signin() {
    showConnect({
      appDetails: {
        name: "subkey",
        icon: "/assets/images/submarine.svg",
      },
      redirectTo: "/",
      onFinish: () => {
        window.location.reload();
      },
      userSession,
    });
  }
  return (
    <div className="flex h-full grow items-center">
      <main className="text-center">
        <p className="text-lg uppercase text-subcomms-gold">Subkey</p>
        <p className="text-lg text-subcomms-gold">A PGP Keyserver storing Public Keys signed with a Stacks crypto wallet such as <Link to={leatherURL}>Leather</Link> or <Link to={xverseURL}>XVerse</Link></p>
        <img className="m-auto max-w-[80%]" src={splashUrl} />
        <Button className="h-12" onClick={signin}>
          Connect Wallet
        </Button>
      </main>
    </div>
  );
}
