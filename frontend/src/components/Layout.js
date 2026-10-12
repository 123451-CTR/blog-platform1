import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {children}
      </main>
    </>
  );
};

export default Layout;