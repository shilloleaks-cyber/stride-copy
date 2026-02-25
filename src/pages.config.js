/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ActiveRun from './pages/ActiveRun';
import ChallengeDetail from './pages/ChallengeDetail';
import Challenges from './pages/Challenges';
import CommunityCoach from './pages/CommunityCoach';
import Discover from './pages/Discover';
import Feed from './pages/Feed';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import HealthConnect from './pages/HealthConnect';
import History from './pages/History';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import LevelProgress from './pages/LevelProgress';
import PaceHistory from './pages/PaceHistory';
import Profile from './pages/Profile';
import Redeem from './pages/Redeem';
import RedeemCatalog from './pages/RedeemCatalog';
import RedeemDetail from './pages/RedeemDetail';
import RunDetails from './pages/RunDetails';
import RunSummary from './pages/RunSummary';
import Stats from './pages/Stats';
import Training from './pages/Training';
import Wallet from './pages/Wallet';
import Welcome from './pages/Welcome';
import ShareRun from './pages/ShareRun';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActiveRun": ActiveRun,
    "ChallengeDetail": ChallengeDetail,
    "Challenges": Challenges,
    "CommunityCoach": CommunityCoach,
    "Discover": Discover,
    "Feed": Feed,
    "GroupDetail": GroupDetail,
    "Groups": Groups,
    "HealthConnect": HealthConnect,
    "History": History,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "LevelProgress": LevelProgress,
    "PaceHistory": PaceHistory,
    "Profile": Profile,
    "Redeem": Redeem,
    "RedeemCatalog": RedeemCatalog,
    "RedeemDetail": RedeemDetail,
    "RunDetails": RunDetails,
    "RunSummary": RunSummary,
    "Stats": Stats,
    "Training": Training,
    "Wallet": Wallet,
    "Welcome": Welcome,
    "ShareRun": ShareRun,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};