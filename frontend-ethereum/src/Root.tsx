import { useEffect, useState } from "react";

import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";

import { Manage } from "./pages/Manage";
import { AddKey } from "./pages/AddKey";
import { RemKey } from "./pages/RemKey";
import { LookupKey } from "./pages/LookupKey";
import { ListKeys } from "./pages/ListKeys";
import { Help } from "./pages/Help";

import { Error } from "./pages/Error";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

import { cookieToInitialState } from "wagmi";
//import "./globals.css";
import { getConfig } from "../wagmi.config";
//import { Providers } from "./providers";
import { ReactNode } from "react";
import { State, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export async function loader() {
  try {
    const userData = userSession.loadUserData();
    return userData;
  } catch {
    return null;
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        loader,
        element: <Help />,
      },
      {
        path: "/add",
        loader,
        element: <AddKey />,
      },
      {
        path: "/rem",
        loader,
        element: <RemKey />,
      },
      {
        path: "/lookup",
        loader,
        element: <LookupKey />,
      },
      {
        path: "/list",
        loader,
        element: <ListKeys />,
      },
      {
        path: "/help",
        loader,
        element: <Help />,
      },
    ],
  },
]);

export function Container() {
  const initialState = cookieToInitialState(
    getConfig(),
		""
//    (await headers()).get("cookie") ?? ""
  );
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());
	return (
	// TODO: change this to use ReactNode and {children} IoC pattern (see Providers.tsx)
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
			  <RouterProvider router={router} />;
			</QueryClientProvider>
    </WagmiProvider>
	)
}

export function Root() {
	var param1;
	var param2;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="m-auto flex w-full max-w-5xl grow flex-col">
				<>
					<Header {...{ param1, param2 }} />
					<main className="border-solid border-1 border-orange-500 rounded-md bg-subcomms-neutral-0 p-6 pb-10">
						<Outlet />
					</main>
				</>
      </div>
      <Footer />
    </div>
  );
}
