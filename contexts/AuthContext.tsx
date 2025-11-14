import React, { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type User = {
  type: "traveler" | "hotel";
  email: string;
  token: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    userType: "traveler" | "hotel",
    email: string,
    password: string
  ) => Promise<void>;
  register: (
    userType: "traveler" | "hotel",
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthManager: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = "http://localhost:5000/api/users";

  const login = async (
    userType: "traveler" | "hotel",
    email: string,
    password: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: userType }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Login failed");

      const userData = {
        type: userType,
        email: data.user.email,
        token: data.token,
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      if (userType === "hotel") {
        navigate("/pricing"); // hotel manager goes to payment plan
      } else {
        navigate("/chat"); // traveler goes to chat
      }
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    userType: "traveler" | "hotel",
    email: string,
    password: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: userType === "hotel" ? "hotelManager" : "traveler",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <AuthManager>{children}</AuthManager>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
