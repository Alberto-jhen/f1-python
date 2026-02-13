import { Routes, Route } from "react-router-dom";
import Login from './pages/Login.jsx'
import { Form } from './pages/Form.jsx'
import { GraphicsDashboard } from "./pages/Graphics.jsx";
import Drivers from './pages/Drivers.jsx'
import { Layout } from './components/Layout.jsx'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout headerVariant="dynamic"> <Login /> </Layout>}/>
            <Route path="/form" element={<Form />}/>
            <Route path="/graphics" element={<Layout> <GraphicsDashboard /> </Layout>}/>
            <Route path="/drivers" element={<Layout> <Drivers /> </Layout>}/>
        </Routes>
    )
}


export default App;