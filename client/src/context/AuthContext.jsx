import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => JSON.parse(localStorage.getItem('queless_customer') || 'null'));
  const [staff, setStaff] = useState(() => JSON.parse(localStorage.getItem('queless_staff') || 'null'));

  function saveCustomer(data) {
    localStorage.setItem('queless_customer_token', data.token);
    localStorage.setItem('queless_customer', JSON.stringify(data.user));
    setCustomer(data.user);
  }

  function saveStaff(data) {
    localStorage.setItem('queless_staff_token', data.token);
    localStorage.setItem('queless_staff', JSON.stringify(data.staff));
    setStaff(data.staff);
  }

  function logoutCustomer() {
    localStorage.removeItem('queless_customer_token');
    localStorage.removeItem('queless_customer');
    setCustomer(null);
  }

  function logoutStaff() {
    localStorage.removeItem('queless_staff_token');
    localStorage.removeItem('queless_staff');
    setStaff(null);
  }

  const value = useMemo(() => ({
    customer,
    staff,
    saveCustomer,
    saveStaff,
    logoutCustomer,
    logoutStaff
  }), [customer, staff]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
