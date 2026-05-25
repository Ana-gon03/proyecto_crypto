import React from 'react'
import { Link } from 'react-router-dom'
import burroLogo from '../../assets/burro.png'
import '../../styles/Registro.css'

const NavbarRegistro = () => {
  return (
    <nav className="registro-nav">
      <Link to="/" className="registro-nav-brand">
        <img src={burroLogo} alt="Blockhome" />
        <span>Blockhome</span>
      </Link>
    </nav>
  )
}

export default NavbarRegistro