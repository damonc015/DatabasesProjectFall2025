import { Link } from '@tanstack/react-router';
import { useState } from 'react';

export default function TemporaryNavigation() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {isOpen ? (
        <nav className='tempnav'>
          <button className='tempnav-button' onClick={toggleMenu}>Hide Menu</button>
          <Link to='/'>Home</Link>
          <Link to='/login'>Login</Link>
          <Link to='/dashboard' className='nav-link'>
            Dashboard
          </Link>
          <Link to='/register'>Register</Link>
        </nav>
      ) : (
        <button className='tempnav-button' onClick={toggleMenu}>Show Menu</button>
      )}
    </>
  );
}
