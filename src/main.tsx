import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { VStack, theme, ChakraProvider } from "@chakra-ui/react";
import { Venue } from "./Venue/Venue.tsx";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <App />
      </QueryParamProvider>
    ),
    children: [{ path: "/venue/:id", element: <Venue /> }],
  },
]);

localStorage.setItem("chakra-ui-color-mode", "dark");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <VStack w="full" h="100vh" spacing={0}>
          <RouterProvider router={router} />
        </VStack>
      </ChakraProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
