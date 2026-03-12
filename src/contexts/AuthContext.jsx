import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot, addDoc, collection } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login(email, password) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // userProfile is set by the onSnapshot listener in onAuthStateChanged
        return result;
    }

    async function register(email, password, name, department) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const profile = {
            name,
            email,
            department,
            role: email.toLowerCase().includes('admin') ? 'admin' : 'employee',
            leaveCredits: { vacation: 15, sick: 10, personal: 5 },
            createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', result.user.uid), profile);

        // Notify admins about new registration
        if (profile.role === 'employee') {
            await addDoc(collection(db, 'notifications'), {
                forAdmin: true,
                title: 'New Employee Registered',
                message: `${name} (${department}) has signed up.`,
                link: '/admin/employees',
                read: false,
                createdAt: serverTimestamp()
            });
        }

        setUserProfile(profile);
        return result;
    }

    async function logout() {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            // Clean up previous profile listener
            if (unsubscribeProfile) unsubscribeProfile();

            if (currentUser) {
                try {
                    // Set up real-time listener for user profile
                    unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
                        if (doc.exists()) {
                            setUserProfile(doc.data());
                        }
                        setLoading(false);
                    }, (err) => {
                        console.error('Profile listener error:', err);
                        setLoading(false);
                    });
                } catch (err) {
                    console.error('Error setting up profile listener:', err);
                    setLoading(false);
                }
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const value = {
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        resetPassword,
        isAdmin: userProfile?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
