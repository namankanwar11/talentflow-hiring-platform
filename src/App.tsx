// src/App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { CandidateProfilePage } from "./pages/CandidateProfilePage";
import { AssessmentBuilderPage } from "./pages/AssessmentBuilderPage";
import { TakeAssessmentPage } from "./pages/TakeAssessmentPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [{
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <JobsPage /> },
        { path: "jobs", element: <JobsPage /> },
        { path: "candidates", element: <CandidatesPage /> },
        { path: "candidates/:id", element: <CandidateProfilePage /> },
        { path: "jobs/:jobId/assessment", element: <AssessmentBuilderPage /> },
        { path: "jobs/:jobId/assessment/take", element: <TakeAssessmentPage /> },
      ],
    }],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}
export default App;