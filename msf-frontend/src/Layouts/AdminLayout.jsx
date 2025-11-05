import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";

const AdminLayout = () => {
  const isLoading = useSelector((state) => state.loading.isLoading);

  return (
    <div className="flex min-h-screen bg-[#f0fbf4]">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="w-12 h-12 border-4 border-white border-t-green-500 rounded-full animate-spin"></div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
