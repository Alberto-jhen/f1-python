import { Routes, Route } from "react-router-dom";
import Login from './pages/Login.jsx'
import { Form } from './pages/Form.jsx'
import { GraphicsDashboard } from "./pages/Graphics.jsx";
import Drivers from './pages/Drivers.jsx'
import { Layout } from './components/Layout/Layout.jsx'
import { Replays } from './pages/Replays.jsx'
import LeaderBoard from "./pages/LeaderBoard.jsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout headerVariant="dynamic"> <Login /> </Layout>}/>
            <Route path="/form" element={<Layout> <Form /> </Layout>}/>
            <Route path="/graphics" element={<Layout> <GraphicsDashboard /> </Layout>}/>
            <Route path="/drivers" element={<Layout> <Drivers /> </Layout>}/>
            <Route path="/replays" element={<Layout> <Replays /> </Layout>} />
            <Route path="/leaderboard" element={<Layout> <LeaderBoard /> </Layout>}/>
        </Routes>
    )
}


export default App;