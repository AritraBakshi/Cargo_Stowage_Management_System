import { Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './Components/Homepage'
import FloatingNavbar from './Components/Navbar'
import Recommendation from './Components/Recomendation'
import SearchRetrieve from './Components/SearchComp'

function App() {
  return (
    <>
        <FloatingNavbar/>
      <Routes>
        <Route path='/' element={<HomePage/>} />
        <Route path='/recommendation' element={<Recommendation/>} />
        <Route path='/retrieve' element={<SearchRetrieve/>} />
      </Routes>
    </>
  )
}

export default App
