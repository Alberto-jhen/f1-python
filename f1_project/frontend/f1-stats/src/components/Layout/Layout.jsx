import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';

export const Layout = ({ children, headerVariant }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header variant={headerVariant}/>
            
            <main className="grow">
                {children}
            </main>

            <Footer />
        </div>
    );
};
