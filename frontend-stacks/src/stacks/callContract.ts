import { ContractCallRegularOptions, openContractCall } from "@stacks/connect";
import { StacksNetwork, StacksMocknet } from "@stacks/network";

import {
  L1_URL,
} from "./env";

const l1Network = new StacksMocknet({ url: L1_URL });

export async function callContract(
  network: StacksNetwork,
  options: Pick<
    ContractCallRegularOptions,
    | "contractAddress"
    | "contractName"
    | "functionName"
    | "functionArgs"
    | "postConditions"
    | "postConditionMode"
  >,
) {
  const txOptions: ContractCallRegularOptions = {
    ...options,
    network,
  };

  await openContractCall(txOptions);
}
