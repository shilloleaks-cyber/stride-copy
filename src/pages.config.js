import Home from './pages/Home';
import ActiveRun from './pages/ActiveRun';
import RunDetails from './pages/RunDetails';
import History from './pages/History';
import Stats from './pages/Stats';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "ActiveRun": ActiveRun,
    "RunDetails": RunDetails,
    "History": History,
    "Stats": Stats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};