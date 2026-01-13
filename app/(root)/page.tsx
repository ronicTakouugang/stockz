'use client'; // Mark page.tsx as a client component to use useEffect and useState

import { useState, useEffect } from 'react';
import HomeClientWrapper from '@/components/HomeClientWrapper';

const Home = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; // Render nothing on the server
    }

    return <HomeClientWrapper />;
}

export default Home;