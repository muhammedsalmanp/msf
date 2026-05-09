import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- Layouts ---
import AdminLayout from "../Layouts/AdminLayout";

// --- Auth Guard Components ---
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import UserLayoutWrapper from "./UserLayoutWrapper";

// --- Error Handling ---
import ErrorBoundary from "./ErrorBoundary";
import NotFoundPage from "../page/NotFoundPage";

// --- Auth Pages ---
import LoginPage from "../page/auth/loginPage";

//---Public page
import HomePage from "../page/PublicPages/HomePage";
import Committee from "../page/PublicPages/Committee";
import ExploreTimeline from "../page/PublicPages/Explore";
import UnilList from "../page/PublicPages/UnitList";
import UnitDetailPage from "../page/PublicPages/UnitDetailPage";

// --- User Pages ---


import UserProfile from "../page/User/UserProfile";
import UnitProfile from "../page/Unit/UnitProfile";

// --- Admin Pages ---
import DashboardPage from "../page/Admin/DashboardPage";
import SlidePage from "../page/Admin/Slide/SlidePage";
import MemberManagement from "../page/Admin/Committee/MemberManagement";
import HarithaMemberManagement from "../page/Admin/Committee/HrithaMemberManagement ";
import AddMember from "../page/Admin/AdminComponents/AddMember";
import EditMember from "../page/Admin/AdminComponents/EditMemberPage";
import JourneySection from "../page/Admin/Journe/JourneySection";
import AddJourneyPage from "../page/Admin/Journe/AddJourneyPage";
import EditJourneyPage from "../page/Admin/Journe/EditJourneyPage";
import UnitGrid from "../page/Admin/UnitDetiols/UnitList";
import UnitCard from "../page/Admin/UnitDetiols/UnitCard";

const AppRouter = () => {
    return (
         <ErrorBoundary>
            <BrowserRouter>
                <Routes>

                    <Route element={<GuestRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                    </Route>

                    <Route path="/" element={<UserLayoutWrapper />}>
                        <Route index element={<HomePage />} />
                        <Route path="committee" element={<Committee />} />
                        <Route path="explore" element={<ExploreTimeline />} />
                        <Route path="units" element={<UnilList />} />
                        <Route path="unit-details/:unitId" element={<UnitDetailPage />} />

                        <Route element={<ProtectedRoute allowedRoles={['incharge']} />}>
                            <Route path="profile" element={<UserProfile />} />
                        </Route>

                        <Route element={<ProtectedRoute allowedRoles={['unit']} />}>
                            <Route path="profile2" element={<UnitProfile />} />
                        </Route>
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route path="dashboard" element={<DashboardPage />} />
                            <Route path="slide" element={<SlidePage />} />
                            <Route path="MsfMemberManagement" element={<MemberManagement />} />
                            <Route path="HarithaMemberManagement" element={<HarithaMemberManagement />} />
                            <Route path="add-member" element={<AddMember />} />
                            <Route path="edit-member/:id" element={<EditMember />} />
                            <Route path="journey" element={<JourneySection />} />
                            <Route path="journey/add" element={<AddJourneyPage />} />
                            <Route path="journey/edit/:id" element={<EditJourneyPage />} />
                            <Route path="units" element={<UnitGrid />} />
                            <Route path="unit-details/:unitId" element={<UnitCard />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />

                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default AppRouter;