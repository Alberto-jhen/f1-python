import { Routes, Route } from "react-router-dom";
import Landing from './pages/Landing.jsx'
import { Form } from './pages/Form.jsx'
import { GraphicsDashboard } from "./pages/Graphics.jsx";
import Drivers from './pages/Drivers.jsx'
import { Layout } from './components/Layout/Layout.jsx'
import { Replays } from './pages/Replays.jsx'
import LeaderBoard from "./pages/LeaderBoard.jsx";
import { DegradationTest } from './pages/DegradationTest.jsx';
import { GlobeCalendar } from './pages/GlobeCalendar.jsx';
import { Register } from './pages/Register.jsx';
import { Toaster } from '@/components/ui/sonner.jsx';
import { Login } from '@/pages/Login.jsx';
import { Profile } from '@/pages/Profile.jsx';
import { Ratings } from '@/pages/Ratings.jsx';

function App() {
    return (
        <>
        <Routes>
            <Route path="/" element={<Layout headerVariant="dynamic"> <Landing /> </Layout>}/>
            <Route path="/form" element={<Layout> <Form /> </Layout>}/>
            <Route path="/graphics" element={<Layout> <GraphicsDashboard /> </Layout>}/>
            <Route path="/drivers" element={<Layout> <Drivers /> </Layout>}/>
            <Route path="/replays" element={<Layout> <Replays /> </Layout>} />
            <Route path="/leaderboard" element={<Layout> <LeaderBoard /> </Layout>}/>
            <Route path="/degradation-test" element={<Layout> <DegradationTest /> </Layout>}/>
            <Route path="/globe-calendar" element={<Layout> <GlobeCalendar /> </Layout>}/>
            <Route path="/login" element={<Login />}/>
            <Route path="/register" element={ <Register /> }/>
            <Route path="/profile" element={ <Layout> <Profile /> </Layout> }/>
            <Route path="/ratings" element={ <Layout> <Ratings /> </Layout> }/>
        </Routes>
        <Toaster />
        </>
    )
}


export default App;