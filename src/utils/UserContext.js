"use client"

import { createContext, useContext, useState } from 'react';

export const UserContext = createContext({
	username: '',
	setUsername: () => {},
});

export function UserProvider({ children }) {
	const [username, setUsername] = useState('');
	// const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  	// const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

	return (
		<UserContext.Provider value={{ username, setUsername }}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	return useContext(UserContext);
}
