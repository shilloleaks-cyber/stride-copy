import ActiveRun from './pages/ActiveRun';
import Discover from './pages/Discover';
import Feed from './pages/Feed';
import History from './pages/History';
import Home from './pages/Home';
import Profile from './pages/Profile';
import RunDetails from './pages/RunDetails';
import Stats from './pages/Stats';
import Wallet from './pages/Wallet';
import Leaderboard from './pages/Leaderboard';
import Challenges from './pages/Challenges';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActiveRun": ActiveRun,
    "Discover": Discover,
    "Feed": Feed,
    "History": History,
    "Home": Home,
    "Profile": Profile,
    "RunDetails": RunDetails,
    "Stats": Stats,
    "Wallet": Wallet,
    "Leaderboard": Leaderboard,
    "Challenges": Challenges,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};