import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar, { NavItem } from "../components/dashboard/Sidebar";
import Overview from "../components/dashboard/sections/Overview";
import Listings from "../components/dashboard/sections/Listings";
import ClientChat from "../components/dashboard/sections/ClientChat";
import Bookings from "../components/dashboard/sections/Bookings";
import AiTools from "../components/dashboard/sections/AiTools";
import AiReports from "../components/dashboard/sections/AiReports";
import Settings from "../components/dashboard/sections/Settings";
import Restaurant from "../components/dashboard/sections/Restaurant";
import { Listing } from "../types";
import { MOCK_LISTINGS } from "../constants";

const HotelDashboardPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<NavItem>("Overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed on mobile
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);

  const handleSaveListing = (
    listingData: Omit<Listing, "id" | "isActive" | "photos"> & {
      photos: (File | string)[];
    },
    editingListing: Listing | null
  ) => {
    const photoUrls = listingData.photos.map((p) =>
      typeof p === "string" ? p : URL.createObjectURL(p)
    );
    if (photoUrls.length === 0) {
      photoUrls.push("https://picsum.photos/seed/newRoom/200/150");
    }

    if (editingListing) {
      // Update existing listing
      const updatedListing = {
        ...editingListing,
        ...listingData,
        photos: photoUrls,
      };
      setListings(
        listings.map((l) => (l.id === editingListing.id ? updatedListing : l))
      );
    } else {
      // Create new listing
      const newListing: Listing = {
        id: `L${listings.length + 1}`,
        name: listingData.name,
        price: listingData.price,
        amenities: listingData.amenities,
        location: listingData.location,
        socialMediaLink: listingData.socialMediaLink,
        whatsappNumber: listingData.whatsappNumber,
        photos: photoUrls,
        isActive: true,
      };
      setListings((prev) => [newListing, ...prev]);
    }
  };

  const handleDeleteListing = (listingId: string) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      setListings(listings.filter((l) => l.id !== listingId));
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "Overview":
        return <Overview />;
      case "Listings":
        return (
          <Listings
            listings={listings}
            onSave={handleSaveListing}
            onDelete={handleDeleteListing}
          />
        );
      case "Client Chat":
        return <ClientChat />;
      case "Bookings":
        return <Bookings listings={listings} />;
      case "Restaurant":
        return <Restaurant />;
      case "AI Tools":
        return <AiTools />;
      case "AI Reports":
        return <AiReports />;
      case "Settings":
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <>
      <style>{`
                @media print {
                    /* Hide non-essential parts of the dashboard when printing */
                    .dashboard-sidebar, .dashboard-header {
                        display: none !important;
                    }
                    /* Ensure the main content takes up the full page */
                    .dashboard-main-content {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    /* The Restaurant component will handle its own print layout */
                }
            `}</style>
      <div className="flex h-full bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
        <Sidebar
          activeItem={activeSection}
          setActiveItem={setActiveSection}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 md:ml-16`}
        >
          <header className="dashboard-header flex items-center justify-between p-4 bg-light-card dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 mr-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <h1 className="text-2xl font-bold">{activeSection}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-sm font-medium text-primary hover:underline"
              >
                Traveler View
              </Link>
              <img
                src="https://picsum.photos/seed/avatar/40/40"
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />
            </div>
          </header>
          <main className="dashboard-main-content flex-1 overflow-y-auto p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </>
  );
};

export default HotelDashboardPage;
