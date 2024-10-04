import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Menu, MenuItem, Typography, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuClick = (menu: string) => {
        setAnchorEl(null);
        navigate(menu)
    }
    const handleLogout = () => {
        sessionStorage.clear()
        navigate('/login')
    }

    return (
        <AppBar position="fixed" sx={{ backgroundColor: "white" }}>
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1, color: "#282c34", fontWeight: "bold" }}>
                    OpenAI Resume analysis
                </Typography>
                <IconButton
                    edge="start"
                    aria-label="menu"
                    sx={{ color: "#282c34" }}
                    onClick={handleMenuOpen}
                >
                    <MenuIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => {handleMenuClick('/upload')}}>Upload Resume</MenuItem>
                    <MenuItem onClick={() => {handleMenuClick('/search')}}>Search Candidate</MenuItem>
                    <MenuItem onClick={() => {handleMenuClick('/')}}>PLACE HOLDER</MenuItem>
                </Menu>
                <Button variant="contained" sx={{ color: "#fefefe", fontWeight: "bold", backgroundColor: "#282c34" }} onClick={handleLogout}>Logout</Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
