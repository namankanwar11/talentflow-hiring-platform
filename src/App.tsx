import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { CandidateProfilePage } from "./pages/CandidateProfilePage";
import { AssessmentBuilderPage } from "./pages/AssessmentBuilderPage";
import { TakeAssessmentPage } from "./pages/TakeAssessmentPage"; // <-- IMPORT

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/jobs" replace /> },
      { path: "/jobs", element: <JobsPage /> },
      { path: "/candidates", element: <CandidatesPage /> },
      { path: "/candidates/:id", element: <CandidateProfilePage /> },
      { path: "/jobs/:jobId/assessment", element: <AssessmentBuilderPage /> },
      { path: "/jobs/:jobId/assessment/take", element: <TakeAssessmentPage /> }, // <-- ADD THIS
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
