import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "../components/common/Button";

export const NotFoundPage = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold text-slate-100">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm mt-2 mb-6">
        The document or page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary" size="md">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
