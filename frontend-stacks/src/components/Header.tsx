import { UserData } from "@stacks/connect";
import { Link, NavLink, NavLinkProps } from "react-router-dom";
import clsx from "clsx";

import titleUrl from "../assets/images/submarine.svg";
import titleIconUrl from "../assets/images/submarine.svg";

import { userSession } from "../stacks/auth";
import { Button, ButtonSmall } from "./ui/Button";
import { H1 } from "./ui/Headings";
import { Addr } from "./ui/Addr";
import { useImmediateInterval } from "../lib/hooks";
import { getL1Balance } from "../stacks/apiCalls";
import { useState } from "react";
import { getLastBlock } from "../stacks/info";
import { L1_URL } from "../stacks/env";
import { Block } from "@stacks/stacks-blockchain-api-types";

import { StacksNetworks, StacksNetwork } from "@stacks/network";
import { StacksMocknet, StacksDevnet, StacksTestnet, StacksMainnet } from "@stacks/network";
import { STACKS_NET } from  "../stacks/env";

type HeaderProps = {
  isLoggedIn: boolean;
  userData: UserData;
};

export function Header({ isLoggedIn, userData }: HeaderProps) {
  const [l1Balance, setL1Balance] = useState(0);
  const [lastBlockInfo, setLastBlockInfo] = useState<Block | null>(null);

  const network = StacksNetwork.fromName(STACKS_NET);
  const address = network.isMainnet() ? userData.profile.stxAddress.mainnet : userData.profile.stxAddress.testnet;

  useImmediateInterval(async () => {
    const l1Info = await getL1Balance(address);
    const block = await getLastBlock(L1_URL);

    setL1Balance(parseFloat(l1Info.balance) / 1_000_000);

    if (!lastBlockInfo || (block && block?.height > lastBlockInfo.height)) {
      setLastBlockInfo(block);
    }
  }, 30_000);

  useImmediateInterval(async () => {}, 60_000);

  function signout() {
    userSession.signUserOut();
    window.location.replace("/");
  }

  return (
    <>
      <header className="border-solid border-1 border-orange-500 mb-1 mt-2 flex items-center justify-between rounded-md bg-subcomms-neutral-0 p-4 text-sm font-aeonik text-subcomms-neutral-300">
        <div className="flex items-center gap-4 md:gap-12">
            <Link to="/">
              <span className="hidden">Subkey</span>
              <img
                className="hidden h-[15px] w-[10px] sm:block md:h-[30px] md:w-[40px]"
                src={titleUrl}
              />
              <img
                className="block h-[15px] w-[15px] sm:hidden"
                src={titleIconUrl}
              />
            </Link>
        </div>
        <div className="flex flex-col justify-center rounded-md lg:flex-row lg:text-left">
          <span>
            Connected with{" "}
            <span className="text-subcomms-black">
              <Addr address={address} />
            </span>
          </span>

          <span className="mx-4 hidden lg:inline-block">/</span>

          <span>
            Balance:{" "}
            <span className="text-subcomms-black">
              {l1Balance.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>{" "}
            STX
          </span>

          <span className="mx-4 hidden lg:inline-block">/</span>

          <span>
            Last block height:{" "}
            <span className="text-subcomms-black">
              {!!lastBlockInfo && lastBlockInfo.height}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-end gap-4">
          <ButtonSmall onClick={signout}>Sign Out</ButtonSmall>
        </div>
      </header>

      <section className="border-solid border-1 border-orange-500 mb-2 mt-1 flex items-center justify-between rounded-md bg-subcomms-neutral-0 p-4 text-sm text-subcomms-neutral-300">
      {/* <MenuLink to="/manage/">Manage Keys</MenuLink> */}
      <MenuLink to="/add/">Add Key</MenuLink>
      <MenuLink to="/rem/">Remove Key</MenuLink>
      <MenuLink to="/lookup/">Lookup Key</MenuLink>
      <MenuLink to="/list/">List Keys</MenuLink>
      <MenuLink to="/help">Help</MenuLink>
      </section>
    </>
  );
}

function MenuLink(
  props: NavLinkProps & React.RefAttributes<HTMLAnchorElement>,
) {
  return (
    <NavLink
      end={false}
      {...props}
      className={clsx("navlink text-sm lg:text-base")}
    />
  );
}
