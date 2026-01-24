import Home from './pages/Home';
import ActiveRun from './pages/ActiveRun';
import RunDetails from './pages/RunDetails';
import History from './pages/History';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import Discover from './pages/Discover';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "ActiveRun": ActiveRun,
    "RunDetails": RunDetails,
    "History": History,
    "Stats": Stats,
    "Profile": Profile,
    "Feed": Feed,
    "Discover": Discover,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};