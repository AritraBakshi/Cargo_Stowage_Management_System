import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Briefcase, Compass, FolderOpen, WashingMachine, Container } from "lucide-react";

export default function FloatingNavbar() {
  return (
    <div className="fixed left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full top-4 px-32 py-4 gap-10 flex space-x-4 border border-gray-300 z-50">
      <NavItem to="/" icon={<Home size={24} />} label="Home" />
      <NavItem to="/placement" icon={<Briefcase size={24} />} label="Place Item" />
      <NavItem to="/recommendation" icon={<Compass size={24} />} label="Recommendation" />
      <NavItem to="/retrieve" icon={<FolderOpen size={24} />} label="Search & Retrieve" />
      <NavItem to={"/waste"} icon={<WashingMachine size={24} />} label="Waste" />
      <NavItem to="/details" icon={<Container size={24} />} label="Container Details" />
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center text-gray-700 hover:text-blue-600">
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}
