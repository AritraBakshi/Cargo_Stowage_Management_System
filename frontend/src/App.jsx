import { Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './Components/Homepage'
import FloatingNavbar from './Components/Navbar'
import Recommendation from './Components/Recomendation'
import SearchRetrieve from './Components/SearchComp'
import ContainerDetails from './Components/Containerdetails'
import WasteManagement from './Components/Wastemanagement'
import ItemPlacementWithContainerDetails from './Components/Placement'
function App() {
  return (
    <>

        <FloatingNavbar/>
      <Routes>
        <Route path='/' element={<HomePage/>} />
        <Route path='/recommendation' element={<Recommendation/>} />
        <Route path='/retrieve' element={<SearchRetrieve/>} />
        <Route path='/details' element={<ContainerDetails/>} />
        <Route path='/waste' element={<WasteManagement/>} />
        <Route path='/placement' element={<ItemPlacementWithContainerDetails/>} />
      </Routes>
    </>
  )
}

export default App
