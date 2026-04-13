import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const authDomain = import.meta.env.VITE_AUTH0_DOMAIN
const authClientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const authAudience = import.meta.env.VITE_AUTH0_AUDIENCE

if (!authDomain || !authClientId || !authAudience) {
  throw new Error(
    'Missing Auth0 client env values. Required: VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE',
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={authDomain}
      clientId={authClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: authAudience,
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </StrictMode>,
)
