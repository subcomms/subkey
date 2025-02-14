import {
  AccountsApi,
  Configuration,
} from "@stacks/blockchain-api-client";
import {
  StxBalance,
} from "@stacks/stacks-blockchain-api-types";
import { L1_URL } from "./env";

const apiConfigL1 = new Configuration({
  basePath: L1_URL,
});
const accountsL1 = new AccountsApi(apiConfigL1);

export async function getL1Balance(principal: string) {
  const balance = await accountsL1.getAccountStxBalance({
    principal,
    unanchored: false,
  });
  return balance as StxBalance;
}
