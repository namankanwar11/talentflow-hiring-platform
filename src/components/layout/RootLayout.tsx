import { NavLink, Outlet } from "react-router-dom";
import { Briefcase } from 'lucide-react';

export function RootLayout() {
  const linkStyles = "text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors";
  const activeLinkStyles = "text-gray-900 font-bold";

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-gray-800" />
              <h1 className="text-2xl font-bold text-gray-800">TalentFlow</h1>
            </div>

            {/* This div controls the spacing for the links */}
            <div className="flex items-center space-x-6">
              <NavLink 
                to="/jobs" 
                className={({ isActive }) => `${linkStyles} ${isActive ? activeLinkStyles : ''}`}
              >
                Jobs
              </NavLink>
              <NavLink 
                to="/candidates" 
                className={({ isActive }) => `${linkStyles} ${isActive ? activeLinkStyles : ''}`}
              >
                Candidates
              </NavLink>
            </div>

          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}