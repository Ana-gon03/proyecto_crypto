import React from 'react'
import { Link } from 'react-router-dom'
import burroLogo from '../../assets/burro.png'

const NavbarSimple = () => {
  return (
    <nav className="navbar-simple">
      <Link to="/" className="navbar-simple-brand">
        <img src={burroLogo} alt="Blockhome" />
        <span>Blockhome</span>
      </Link>
      
      <div className="navbar-simple-right">
        <Link to="/registro" className="navbar-simple-login">
           Registro
        </Link>
      </div>
    </nav>
  )
}

export default NavbarSimple