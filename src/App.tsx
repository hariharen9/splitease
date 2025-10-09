import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import React, { Suspense } from "react";

import GlobalLoader from "./components/GlobalLoader";

const Index = React.lazy(() => import("./pages/Index"));
const Session = React.lazy(() => import("./pages/Session"));
const AllSessions = React.lazy(() => import("./pages/AllSessions"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const JoinSessionPage = React.lazy(() => import("./pages/JoinSessionPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Suspense fallback={<GlobalLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/join/:pin" element={<JoinSessionPage />} />
              <Route path="/session/:id" element={<Session />} />
              <Route path="/sessions" element={<AllSessions />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;