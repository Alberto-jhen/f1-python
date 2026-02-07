import { Header } from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import DriverInfoSelector from '@/components/DriverInfoSelector.jsx';
import { fetchDriverProfile } from '../service/apiService.js'
import React, { useState, useEffect } from 'react';

export default function Drivers() {
    return (
        <>
            <Header />
            <DriverInfoSelector />
            <Footer />
        </>
        
    )
}

