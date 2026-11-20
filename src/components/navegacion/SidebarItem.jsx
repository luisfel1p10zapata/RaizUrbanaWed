import { NavLink } from 'react-router-dom';

const SidebarItem = ({ item }) => {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `sidebar-item${isActive ? ' active' : ''}`
            }
        >
            <Icon size={18} />

            <span className="sidebar-item-label">
                {item.label}
            </span>
        </NavLink>
    );
};

export default SidebarItem;