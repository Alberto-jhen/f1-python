import { Routes, Route } from "react-router-dom";
import Login from './pages/Login.jsx'
import { Form } from './pages/Form.jsx'
import { GraphicsDashboard } from "./pages/Graphics.jsx";
import { Header } from './components/Header.jsx'
import { Footer } from './components/Footer.jsx'
import Drivers from './pages/Drivers.jsx'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />}/>
            <Route path="/form" element={<Form />}/>
            <Route path="/graphics" element={<GraphicPage />}/>
            <Route path="/drivers" element={<Drivers />}/>
        </Routes>
    )
}

const GraphicPage = () => {
    return (
        <>
        <div className="relative flex flex-col"> 
            <div className="relative z-9999">
                <Header />
            </div>
                <main className="relative z-0">
                    <GraphicsDashboard />
                </main>
            <Footer />
        </div>
    </>
    )
}

export default App;