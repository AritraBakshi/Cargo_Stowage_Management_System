import { Route, Routes } from 'react-router-dom'
import { Navbar } from './components/layout/navbar'
import './App.css'
import HomePage from './components/pages/home'
import SearchRetrievePage from './components/pages/search-retrieve'
import ContainerDetailsPage from './components/pages/container-details'
import WasteManagementPage from './components/pages/waste-management'
import ItemPlacementPage from './components/pages/item-placement'
import Recommendation from './components/Recomendation'

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-10">
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/recommendation' element={<Recommendation />} />
          <Route path='/retrieve' element={<SearchRetrievePage />} />
          <Route path='/details' element={<ContainerDetailsPage />} />
          <Route path='/waste' element={<WasteManagementPage />} />
          <Route path='/placement' element={<ItemPlacementPage />} />
        </Routes>
      </main>
    </div>
  )
}
