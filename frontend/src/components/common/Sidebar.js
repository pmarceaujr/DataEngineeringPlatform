/**
 * Sidebar Navigation
 */

import React from 'react';
import { Nav } from 'react-bootstrap';
import {
    FaChartLine,
    FaDatabase,
    FaHome,
    FaProjectDiagram,
    FaTasks,
    FaUsers
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const navItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/data-sources', icon: FaDatabase, label: 'Data Sources' },
    { path: '/pipelines', icon: FaProjectDiagram, label: 'Pipelines' },
    { path: '/quality', icon: FaChartLine, label: 'Quality' },
    { path: '/workspaces', icon: FaUsers, label: 'Workspaces' },
    { path: '/tasks', icon: FaTasks, label: 'Tasks' }
  ];

  return (
    <div className="sidebar bg-dark text-white" style={{ width: '250px', minHeight: '100vh' }}>
      <div className="p-4">
        <h3 className="mb-4">DE Platform</h3>
        
        <Nav className="flex-column">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link text-white mb-2 ${isActive ? 'active bg-primary' : ''}`
              }
            >
              <item.icon className="me-2" />
              {item.label}
            </NavLink>
          ))}
        </Nav>
      </div>
    </div>
  );
}

export default Sidebar;