export const Header = () => {
    return (
        <header className="flex justify-between items-center p-10 border-b border-gray-400">
            <h1 className="text-red-600 font-black italic text-4xl">
                F1 STATS
            </h1>
            <nav className="flex" >
                <a href='/form.html' className="text-white hover:underline">Contacto</a>
            </nav>
        </header>
    )
}