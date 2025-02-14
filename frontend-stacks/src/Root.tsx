import { useEffect, useState } from "react";
import { UserData } from "@stacks/connect";

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
import { userSession } from "./stacks/auth";
import { Splash } from "./components/Splash";

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
  return <RouterProvider router={router} />;
}

export function Root() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
      });
    } else if (userSession.isUserSignedIn()) {
      setIsLoggedIn(true);
      setUserData(userSession.loadUserData());
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="m-auto flex w-full max-w-5xl grow flex-col">
        {isLoggedIn && userData ? (
          <>
            <Header {...{ isLoggedIn, userData }} />
            <main className="border-solid border-1 border-orange-500 rounded-md bg-subcomms-neutral-0 p-6 pb-10">
              <Outlet />
            </main>
          </>
        ) : (
          <Splash />
        )}
      </div>
      <Footer />
    </div>
  );
}
