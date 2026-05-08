import { Routes, Route } from 'react-router-dom'
import DefaultPage from './pages/authentication/default_page';
import VerifyEmailPage from './pages/authentication/VerifyEmailPage';
import Home from './pages/home/home';


export default function App() {

  
  return (

    <Routes>
      <Route path='/' element={<DefaultPage />}/>
      <Route path='/verify-email' element={
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '24px' }}>
          <VerifyEmailPage />
        </div>
      }/>
      <Route path='/home/*' element={<Home />} />
    </Routes>
  )
}
