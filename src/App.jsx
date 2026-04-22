import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import MyRewards from './pages/MyRewards';
import CouponDashboard from './pages/CouponDashboard';
import StaffManagement from './pages/StaffManagement';
import StaffRedeem from './pages/StaffRedeem';
import StrideEvents from './pages/StrideEvents';
import StrideEventDetail from './pages/StrideEventDetail';
import StrideMyEvents from './pages/StrideMyEvents';
import StrideAdminDashboard from './pages/StrideAdminDashboard';
import StrideCheckin from './pages/StrideCheckin';
import SponsorClaim from './pages/SponsorClaim';
import CreateOfficialEvent from './pages/CreateOfficialEvent';
import ManageCategories from './pages/ManageCategories';
import AdminEvents from './pages/AdminEvents';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Track navigation direction for slide transitions
const NAV_ROOTS = ['Home', 'Training', 'Feed', 'Events', 'Profile'];
function useNavDirection() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const direction = useRef(1); // 1 = forward (slide left), -1 = back (slide right)

  const isRootPage = (path) => NAV_ROOTS.some(r => path === `/${r}` || path === '/');
  const prevIsRoot = isRootPage(prevPath.current);
  const currIsRoot = isRootPage(location.pathname);

  if (prevPath.current !== location.pathname) {
    if (currIsRoot && !prevIsRoot) {
      direction.current = -1;
    } else if (!currIsRoot && prevIsRoot) {
      direction.current = 1;
    } else if (currIsRoot && prevIsRoot) {
      direction.current = 1;
    }
    prevPath.current = location.pathname;
  }

  return direction.current;
}

function AnimatedRoutes({ children }) {
  const location = useLocation();
  const dir = useNavDirection();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ x: dir * 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: dir * -30, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: 'relative', width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatedRoutes>
      <Routes location={location}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}

        <Route path="/MyRewards" element={<LayoutWrapper currentPageName="MyRewards"><MyRewards /></LayoutWrapper>} />
        <Route path="/CouponDashboard" element={<LayoutWrapper currentPageName="CouponDashboard"><CouponDashboard /></LayoutWrapper>} />
        <Route path="/StaffManagement" element={<LayoutWrapper currentPageName="StaffManagement"><StaffManagement /></LayoutWrapper>} />
        <Route path="/StaffRedeem" element={<LayoutWrapper currentPageName="StaffRedeem"><StaffRedeem /></LayoutWrapper>} />
        <Route path="/StrideEvents" element={<LayoutWrapper currentPageName="StrideEvents"><StrideEvents /></LayoutWrapper>} />
        <Route path="/StrideEventDetail" element={<LayoutWrapper currentPageName="StrideEventDetail"><StrideEventDetail /></LayoutWrapper>} />
        <Route path="/StrideMyEvents" element={<LayoutWrapper currentPageName="StrideMyEvents"><StrideMyEvents /></LayoutWrapper>} />
        <Route path="/StrideAdminDashboard" element={<LayoutWrapper currentPageName="StrideAdminDashboard"><StrideAdminDashboard /></LayoutWrapper>} />
        <Route path="/StrideCheckin" element={<LayoutWrapper currentPageName="StrideCheckin"><StrideCheckin /></LayoutWrapper>} />
        <Route path="/SponsorClaim" element={<LayoutWrapper currentPageName="SponsorClaim"><SponsorClaim /></LayoutWrapper>} />
        <Route path="/CreateOfficialEvent" element={<LayoutWrapper currentPageName="CreateOfficialEvent"><CreateOfficialEvent /></LayoutWrapper>} />
        <Route path="/ManageCategories" element={<LayoutWrapper currentPageName="ManageCategories"><ManageCategories /></LayoutWrapper>} />
        <Route path="/AdminEvents" element={<LayoutWrapper currentPageName="AdminEvents"><AdminEvents /></LayoutWrapper>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatedRoutes>
  );
};


function App() {

  return (
    <LanguageProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
    </LanguageProvider>
  )
}

export default App