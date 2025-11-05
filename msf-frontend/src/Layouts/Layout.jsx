import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";

const Layout = () => {
  const isLoading = useSelector((state) => state.loading.isLoading);

  return (
    <>

      <Navbar />

      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
