"use client";

import { createContext, useContext } from "react";

const UserContext = createContext(null);

export function UserProvider({ value, children }) {
	// `value` is your user object coming from the server layout
	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
	return useContext(UserContext); // use inside Client Components
}
