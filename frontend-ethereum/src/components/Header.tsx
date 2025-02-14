import { Link, NavLink, NavLinkProps } from "react-router-dom";
import clsx from "clsx";

import titleUrl from "../assets/images/submarine.svg";
import titleIconUrl from "../assets/images/submarine.svg";

import { Button, ButtonSmall } from "./ui/Button";
import { H1 } from "./ui/Headings";
import { Addr } from "./ui/Addr";
import { useImmediateInterval } from "../lib/hooks";
import { useState } from "react";

import { EthereumConnect } from "./EthereumConnect";
import { MetaMaskSDK } from '@metamask/sdk';

import { useAccount, useBalance, useBlockNumber } from 'wagmi';

type HeaderProps = {
  isLoggedIn: boolean;
  userData: UserData;
};

export function Header({ param1, param2 }: HeaderProps) {
  const [l1Balance, setL1Balance] = useState(0);
  const [lastBlockInfo, setLastBlockInfo] = useState(null);
  const [address, setAddress] = useState('');

  const MMSDK = new MetaMaskSDK({
    dappMetadata: {
      name: "Subkey",
      url: window.location.href,
    },
//    infuraAPIKey: process.env.INFURA_API_KEY,
  });

  async function getL1Balance() {
		const accounts = await MMSDK.connect();
    const provider = MMSDK.getProvider();
    const address = await provider.request({
      method: "eth_accounts",
      params: [],
    });
		var balance = 0;
		if (address.length > 0) {
			const userAddress = address[0];
			if (userAddress !== address) {
				setAddress(userAddress);
			}
			//const response = await MMSDK.eth_getBalance(address, 'latest');
			const response = await helper_getL1Balance(userAddress);
      balance = parseInt(response, 16);
	  }
//    console.log(`Balance: ${balance} wei`);
		return balance;
  }
  
	async function helper_getL1Balance(address) {
    const provider = window.ethereum;
    const result = (await provider?.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    })) as string[];
    return result;
  }

  const rpc_getL1Balance = async () => {
    const provider = window.ethereum;
    if (!provider?.selectedAddress) {
      return;
    }
//    console.log('current chainId', provider?.chainId);
    const result = (await provider?.request({
      method: 'eth_getBalance',
      params: [provider.selectedAddress, 'latest'],
    })) as string[];
    return result;
  }

  async function getLastBlock() {
    try {
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      const provider = window.ethereum;
      const response = await provider.send("eth_blockNumber", []);
      const blockNum = parseInt(response.result, 16);
//      const blockNum = new BN(response.result, 16).toString(10);
//      console.log("Latest block number:", blockNum);
//      console.dir(result);
      return blockNum;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  useImmediateInterval(async () => {
    const block = await getLastBlock();
    if (!lastBlockInfo || (block && block > lastBlockInfo)) {
      setLastBlockInfo(block);
    }

    const l1Info = await getL1Balance();
    setL1Balance(parseFloat(l1Info) / 1_000_000_000_000_000_000);
  }, 30_000);
  
  useImmediateInterval(async () => {}, 60_000);

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
            ETH
          </span>

          <span className="mx-4 hidden lg:inline-block">/</span>

          <span>
            Last block height:{" "}
            <span className="text-subcomms-black">
              {!!lastBlockInfo && lastBlockInfo}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-end gap-4">
          <EthereumConnect />
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
