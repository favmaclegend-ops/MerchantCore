import { Routes, Route } from 'react-router-dom'
import DefaultPage from './pages/authentication/default_page';
import Home from './pages/home/home';


export default function App() {

 
  return (

    <Routes>
      <Route path='/' element={<DefaultPage />}/>
      <Route path='/home/*' element={<Home />} />
    </Routes>
  )
}
