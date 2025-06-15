
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to login page (or dashboard if authenticated)
  return <Navigate to="/login" />;
};

export default Index;
