import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "../features/auth/components/AuthGuard";
import SignIn from "../features/auth/pages/SignIn";
import SignUp from "../features/auth/pages/SignUp";
import DeviceVerify from "../features/auth/pages/DeviceVerify"; // add
import Home from "./routes/Home";
import Dashboard from "./routes/Dashboard";
import ProtectedLayout from "./layouts/ProtectedLayout";

export const router = createBrowserRouter([
  {
    path: "/sign-in",
    element: <SignIn />,
  },
  {
    path: "/sign-up",
    element: <SignUp />,
  },
  {
    path: "/device/verify/:sessionId", // add
    element: <DeviceVerify />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "dashboard", element: <Dashboard /> },
        ],
      },
    ],
  },
]);