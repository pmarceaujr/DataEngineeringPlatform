/**
 * Header Component
 */

import React from 'react';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { FaBell, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../../redux/slices/authSlice';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return (
    <Navbar bg="white" className="border-bottom px-4 py-3">
      <Container fluid>
        <Navbar.Text className="me-auto">
          <h4 className="mb-0">Welcome back, {user?.firstName}!</h4>
        </Navbar.Text>

        <Nav className="align-items-center">
          <Nav.Link className="position-relative me-3">
            <FaBell size={20} />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              3
            </span>
          </Nav.Link>

          <NavDropdown
            title={
              <span>
                <FaUser className="me-2" />
                {user?.firstName} {user?.lastName}
              </span>
            }
            align="end"
          >
            <NavDropdown.Item onClick={() => navigate('/profile')}>
              <FaUser className="me-2" />
              Profile
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => navigate('/settings')}>
              <FaCog className="me-2" />
              Settings
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout}>
              <FaSignOutAlt className="me-2" />
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Header;