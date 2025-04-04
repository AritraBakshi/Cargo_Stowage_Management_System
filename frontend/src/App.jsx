import { Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './Components/Homepage'
import FloatingNavbar from './Components/Navbar'

function App() {
  return (
    <>
        <FloatingNavbar/>
      <Routes>
        <Route path='/' element={<HomePage/>} />
      </Routes>
    </>
  )
}

export default App
