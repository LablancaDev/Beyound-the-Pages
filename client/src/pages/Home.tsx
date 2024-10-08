import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, CartBook } from '../redux/types';
import { RootState } from '../redux/store';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { fetchBooksFailure, fetchBooksStart, fetchBooksSuccess } from '../redux/booksSlice';
import { addToCart } from '../redux/cartSlice';
import banner from '../assets/img/banner.webp'
import { Link } from 'react-router-dom';


const Home = () => {

    // Obtener la URL base de la API según el entorno
    const apiUrl = import.meta.env.MODE === 'production'
        ? import.meta.env.VITE_APP_API_URL_PRODUCTION
        : import.meta.env.VITE_APP_API_URL_LOCAL;

    console.log("API URL:", apiUrl);
    console.log("Variables de entorno:", import.meta.env); // para verificar si las variables de entorno están disponibles y cargadas. SABER EL MODO SI EN PRODUCTION O DESARROLLO
    console.log(import.meta.env.MODE)
    console.log(`Contrucción de la API URL: ${apiUrl}/api/books/getBooks?page=$page`);

    // Recuperación de user_id del estado global, necesario para enviarlo al añadir productos y poderlos asocia al id del usuario que inició la sesión 
    const { user_id } = useSelector((state: RootState) => state.auth)

    const dispatch = useDispatch()
    // Obtén el estado de libros desde Redux
    const { books, loading, error } = useSelector((state: RootState) => state.books)

    // Estados locales
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState(''); // Nuevo estado para el término de búsqueda
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]); // Estado para los libros filtrados
    const [selectCategory, setSelectCategory] = useState('')

    // Estado para rastrear qué libros han sido comprados y mostrar el mensaje (simplemente se encarga de mostrar el mensaje de Comprado! en el libro comprado)
    const [purchasedBooks, setPurchasedBooks] = useState<{ [key: string]: boolean }>({}); //es un objeto que almacena el key del libro en el momento de la compra para mostrar el mensaje

    // Estados para Offcanvas
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [selectedBooks, setSelectedBooks] = useState<CartBook[]>([]);

    //* Función encargada de obtener todos los libros de la API a través del controlador, la API se consume en el backend. GESTIONA LA CARGA DE LIBROS DESDE LA API
    const getBooks = async () => {

        // Actualiza la carga de libros a True en el estado global
        dispatch(fetchBooksStart())

        try {                                                                            // url en producción:  https://beyond-the-pages-three.vercel.app/api/books/getBooks?page=1
            const response = await axios.get(`${apiUrl}/api/books/getBooks?page=${page}`,); // url que apunta a servidor local: `http://localhost:5000/api/books/getBooks?page=${page}`
            const data = response.data;
            dispatch(fetchBooksSuccess(data));
            setFilteredBooks(data); // Inicialmente, todos los libros son filtrados
            console.log("Solicitud a la api correcta!", data);
        } catch (error) {
            // Manejo del error con verificación de tipo
            let errorMessage = "Error fetching books";

            // Verifica si el error es de Axios
            if (axios.isAxiosError(error)) {
                // Puedes acceder a error.response aquí
                errorMessage = error.response?.data?.message || errorMessage; // Ajusta según la estructura de tu respuesta
                console.error("Error fetching books:", errorMessage);
            } else {
                console.error("Error fetching books:", error);
            }

            dispatch(fetchBooksFailure(errorMessage));
        }

    };


    // Lamada a la function que se encarga de obtener los libros de la API cuando carga el componente
    useEffect(() => {
        getBooks();
    }, [page]); // Vuelve a llamar a la API cuando cambie la página


    // Maneja el cambio en el input de búsqueda
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        // Filtrar los libros basado en el término de búsqueda
        const filtered = books.filter(book =>
            book.title.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredBooks(filtered);
    };
    console.log("Libros filtrados por búsqueda:", filteredBooks)


    const handleCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const category = e.target.value;
        setSelectCategory(category)

        if (category) {

            const filtered = books.filter(book => {
                // books.category es un array y lo estaba comparando con una cadena, por eso no funciona
                // book.category === category

                // Verifica si book.category es un arreglo si es así, accede al primer elemento, de lo contrario, utiliza el valor de book.category (si es un string)
                const bookCategory = Array.isArray(book.category) ? book.category[0] : book.category; //al accede al primer elemento, accedemos por fin al string

                // Asegúrate de que bookCategory sea un string antes de usar toLowerCase
                // Esto evita errores si book.category no es una cadena
                return typeof bookCategory === 'string' && bookCategory.toLowerCase().includes(category.toLowerCase());
            });
            // Una vez que se han filtrado los libros, se actualiza el estado filteredBooks con el nuevo arreglo de libros que coinciden con la categoría seleccionada.
            setFilteredBooks(filtered)
        } else {
            // Si no hay categoría seleccionada, muestra todos los libros
            setFilteredBooks(books);
        }
    }
    // Aquí comprobamos que books es un array antes de intentar mapearlo
    console.log("Array completo de libros:", Array.isArray(books) ? books : []);
    console.log("Títulos de libros:", Array.isArray(books) ? books.map(book => book.title) : []);
    console.log("Categorías de libros:", Array.isArray(books) ? books.map(book => book.category) : []);
    console.log("Portadas de libros:", Array.isArray(books) ? books.map(book => book.cover) : []);
    console.log("Categoria seleccionada:", selectCategory);

    // console.log("Libros filtrados por categoría:", filteredBooks)
    console.log(selectCategory)

    // Añadir un libro al carrito de compras en la base de datos 
    const handleAddBook = async (book: Book) => {
        const userId = user_id; // Id del usuario que está logeado para asignar el libro a ese user 
        try {
            const response = await axios.post(`${apiUrl}/api/books/addBooks`, { // a server local: "http://localhost:5000/api/books/addBooks"
                userId, // Reemplaza esto con el ID del usuario que está logeado
                book
                // IMPORTANTE BOOK CONTIENE LOS DATOS DEL LIBRO, PASAMOS EL ARRAY DE OBJETOS DIRECTAMENTE AL CONTROLADOR, ALLÍ SE EXTRAE LOS DATOS NECESARIOS, COMO EL ID DEL LIBRO
            })

            // Actualiza el estado de libros comprados, purchasedBooks que es un objeto donde cada clave es el key del libro y el valor es un booleano que indica si el libro ha sido comprado o no.    
            const bookKey = book.key; // Cambia esto según el identificador único que uses
            if (bookKey) {
                setPurchasedBooks(prev => ({ ...prev, [bookKey]: true }));// Marca este libro como comprado
            } else {
                console.error("El libro no tiene una clave válida para marcar como comprado.");
            }

            // Verifica si el libro ya está en selectedBooks  
            const existingBook = selectedBooks.find(item => item.key === book.key)

            // Si ya existe, actualiza la cantidad en lugar de añadirlo de nuevo 
            if (existingBook) {
                // Si ya existe, actualiza la cantidad sumando la existente +1
                const updatedQuantity = existingBook.quantity + 1;

                // Actualiza la cantidad en el estado selectedBooks
                setSelectedBooks(prevSelectedBooks =>
                    prevSelectedBooks.map(item =>
                        item.key === book.key ? { ...item, quantity: updatedQuantity } : item
                    )
                );
            } else {
                // Si no existe, añade el libro como CartBook con quantity inicial de 1
                const newCartBook: CartBook = { ...book, quantity: 1 }; // Conversión de Book a CartBook

                setSelectedBooks(prevSelectedBooks => [...prevSelectedBooks, newCartBook]);
            }

            setShowOffcanvas(true);


            //  ES EL ÚNICO DISPATCH AL SLICE DEL CARRITO, EL RESTO ESTÁN EN EL COMPONETE CART PARA ELIMINAR UN PRODUCTO DEL CARRITO O LIMPIAR EL CARRITO
            // Se añade el libro seleccionado al estado global del Carrito
            const newCartBook: CartBook = { ...book, quantity: 1 };
            dispatch(addToCart(newCartBook));

            console.log("Libro añadido al carrito:", response.data);
        } catch (error) {
            console.error("Error al añadir el libro:", error);
            alert("Error al añadir el libro al carrito. Inténtalo de nuevo.");
        }
        console.log("Click del id del libro que se pasa al controller:", book.key)
    }

    // Calcular el total de la cantidad de libros en el carrito
    const totalQuantity = selectedBooks.reduce((total, book) => total + book.quantity, 0);

    // Calcular el precio anterior con un 5% de descuento
    const previousPrice = filteredBooks.map(book => ({
        ...book,
        previousPrice: (book.price * 1.05).toFixed(2)
    }))

    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) return <div>Error: {error}</div>;

    return (
        <div className='container-fluid home'>
            <h1 className='text-center my-4'>Listado de Libros</h1>
            <div className='d-flex justify-content-center mt-5'>
                <img className='img-fluid w-100' src={banner} alt="banner" />
            </div>
            <div className='d-flex justify-content-between align-items-center my-4 gap-2'>
                <select className='form-control w-25 m-auto filter text-light' onChange={handleCategory}>
                    <option className='filter' value="">Filtrar por categoría</option>
                    {Array.from( // Convierte el conjunto de nuevo en un array para poder mapearlo.
                        // Utilizamos Set para eliminar duplicados de las categorías obtenidas
                        new Set(
                            // Mapeamos los libros para obtener solo las categorías
                            books
                                .map(book => book.category)
                                // Filtramos para eliminar cualquier categoría que sea null, undefined o vacía ("")
                                .filter(category => category)
                        )
                    ).map((category, index) => (
                        // Generamos una opción por cada categoría, asignando una key única usando el índice
                        <option className='filter' key={index} value={category}>{category}</option>
                    ))}
                </select>
                <input
                    className='form-control w-75 filter custom-input'
                    type='text'
                    placeholder='Buscar por título...'
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>
            <div className="row">
                {Array.isArray(previousPrice) && previousPrice.map((book, index) => (
                    <div className='col-6 col-sm-4 col-md-3 col-lg-2 col-xl-2 mb-4' key={index}>
                        <div className='card text-center h-100' style={{ maxHeight: '500px', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
                            <Link
                                to="/bookdetail"
                                state={{ book }} // Pasamos el libro seleccionado a la página bookdetails, en bookdetails usaré location para acceder a los datos 
                            >
                                <img
                                    className='img-fluid w-100'
                                    src={book.cover}
                                    alt={book.title}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                            </Link>
                            <div className='card-body'>
                                <h6 className='card-title' style={{ minHeight: '50px' }}>{book.title}</h6>
                            </div>
                            <div>
                                <div className='d-flex justify-content-center align-items-center gap-2'>
                                    <h6 className='text-secondary text-decoration-line-through'>{book.previousPrice} €</h6>
                                    <h6 className='text-light bg-danger w-25'>-5%</h6>
                                </div>
                                <h5 className='text-danger'>{book.price} €</h5>
                                <p className='text-success'>ENVÍO GRATIS! <i className="bi bi-truck"></i></p>
                            </div>
                            <div>
                                <button onClick={() => handleAddBook(book)} className='btn btn-success m-2'><i className="bi bi-bag-heart"></i> Añadir</button>
                            </div>
                            {/*se define primero book.key para que no sea undefined antes de intentar acceder a purchasedBooks. */}
                            {book.key && purchasedBooks[book.key] && <p className='text-primary'>Añadido!</p>} {/* Solo muestra el mensaje si ha sido comprado el libro*/}
                        </div>
                    </div>
                ))}
            </div>


            {/* Offcanvas para mostrar los detalles de los libros seleccionados */}
            <div
                className={`offcanvas offcanvas-end ${showOffcanvas ? 'show' : ''}`}
                tabIndex={-1}
                style={{
                    display: showOffcanvas ? 'block' : 'none',
                    width: '300px', // Cambia el tamaño del offcanvas ajustando el ancho aquí
                }}
                aria-labelledby="offcanvasLabel"
            >
                <div className="offcanvas-header flex-column text-light">
                    <div className='d-flex justify-content-between align-items-center w-100'>
                        <h5 id="offcanvasLabel">Carrito de Compras <i className="bi bi-cart3"></i></h5>
                        <button type="button" className="btn-close" onClick={() => setShowOffcanvas(false)}></button>
                    </div>

                </div>
                {/* body Offcanvas */}
                <div className="offcanvas-body"
                    style={{
                        overflowY: 'auto', // Permite el scroll vertical
                        maxHeight: 'calc(100vh - 100px)', // Altura máxima para no salir de la pantalla
                        background: ' rgb(254, 255, 198)'
                    }}
                >
                    {selectedBooks.length > 0 ? (
                        selectedBooks.map((book, index) => (
                            <div key={index} className="mb-3">
                                <img src={book.cover} alt={book.title} className="img-fluid" style={{ height: '100px', width: 'auto' }} />
                                <h6>{book.title}</h6>
                                <p>Precio: <span className='text-danger'>{book.price} €</span></p>
                                <hr />
                            </div>
                        ))
                    ) : (
                        <p>No hay libros en el carrito.</p>
                    )}
                </div>
                {/* Footer del Offcanvas */}
                <div
                    className="offcanvas-footer text-light position-fixed w-100"
                    style={{
                        padding: '10px 20px',
                        borderTop: '1px solid #dee2e6',
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 1,
                    }}
                >
                    <h5>Total de Libros: <span className='text-danger'>{totalQuantity} unidades</span></h5>
                    <div className='my-3 w-100'>
                        <Link
                            to={'/cart'}
                        >
                            <button className='btn btn-success'>Mi Carrito <i className="bi bi-cart-check-fill"></i></button>
                        </Link>
                    </div>

                </div>
            </div>


            <div className='d-flex justify-content-between my-4'>
                <button className='btn btn-secondary' onClick={() => setPage(page - 1)} disabled={page === 1}>
                    Previous
                </button>
                <button className='btn btn-primary' onClick={() => setPage(page + 1)}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default Home;
