import { ChevronDown, ChevronRight } from 'lucide-react';

const SidebarSection = ({
  section,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="sidebar-section">
      <button
        type="button"
        className="sidebar-section-header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="sidebar-section-title">
          {section.title}
        </span>

        {isOpen ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
      </button>

      {isOpen && (
        <div className="sidebar-section-items">
          {children}
        </div>
      )}
    </div>
  );
};

export default SidebarSection;