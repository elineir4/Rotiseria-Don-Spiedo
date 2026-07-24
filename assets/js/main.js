// main.js - Archivo principal que orquesta todos los módulos

// Variables globales para la promoción de 3 pizzas
let promocion3PizzasActiva = false;
let pizzasSeleccionadas = [];

// Esperar a que los módulos estén cargados
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar carrito si estamos en la página principal
    if (document.getElementById('itemsCarrito')) {
        // Referencias a elementos del carrito
        const contenedorItemsCarrito = document.getElementById('itemsCarrito');
        const carritoFlotante = document.getElementById('carritoFlotante');
        const botonCerrarCarrito = document.getElementById('botonCerrarCarrito');
        const botonIconoCarrito = document.querySelector('.botonCarrito');
        
    // Cargar carrito desde localStorage usando la función del módulo
    carritoModule.cargarCarritoDesdeStorage();
        
        // Eventos del carrito
        if (botonIconoCarrito) {
            botonIconoCarrito.addEventListener('click', () => carritoModule.alternarCarrito(true));
        }
        
        if (botonCerrarCarrito) {
            botonCerrarCarrito.addEventListener('click', () => carritoModule.alternarCarrito(false));
        }
        
        // Eventos de las promociones
        document.querySelectorAll('.tarjetaPromocion').forEach(tarjeta => {
            tarjeta.addEventListener('click', () => {
                const nombrePromocion = tarjeta.dataset.promocion;
                const promocion = menuModule.promociones[nombrePromocion];
                
                // Verificar si es una promoción múltiple (3 pizzas)
                if (promocion && promocion.tipo === 'promocionMultiple') {
                    iniciarPromocion3Pizzas(nombrePromocion, promocion);
                } else if (nombrePromocion && promocion) {
                    menuModule.abrirDetalleMenu(nombrePromocion);
                }
            });
        });
        
        // Eventos de las tarjetas del menú
        document.querySelectorAll('.tarjeta').forEach(tarjeta => {
            tarjeta.addEventListener('click', (event) => {
                if (event.target.closest('.botonOpcion')) return;
                
                const titulo = tarjeta.querySelector('h3');
                if (titulo) {
                    menuModule.abrirDetalleMenu(titulo.textContent.trim());
                }
            });
        });
        
        // Evento del botón cerrar detalle menú
        if (menuModule.botonCerrarDetalle) {
            menuModule.botonCerrarDetalle.addEventListener('click', () => {
                // Si se cierra en medio de la promoción, cancelar
                if (promocion3PizzasActiva) {
                    cancelarPromocion3Pizzas();
                }
                menuModule.cerrarDetalleMenu();
            });
        }
        
        // Evento del detalle menú para cerrar al hacer click fuera
        if (menuModule.detalleMenu) {
            menuModule.detalleMenu.addEventListener('click', (event) => {
                if (event.target === menuModule.detalleMenu) {
                    if (promocion3PizzasActiva) {
                        cancelarPromocion3Pizzas();
                    }
                    menuModule.cerrarDetalleMenu();
                }
            });
        }
        
        // Eventos de los checkboxes de ingredientes
        menuModule.opcionesDetalle?.addEventListener('change', (event) => {
            const checkbox = event.target.closest('.checkboxIngrediente');
            if (checkbox) {
                const itemName = checkbox.dataset.item;
                const ingId = checkbox.dataset.ing;
                const ingType = checkbox.dataset.type;
                const key = `${menuModule.menuActual}-${itemName}`;
                
                if (!menuModule.ingredientesSeleccionados[key]) {
                    menuModule.ingredientesSeleccionados[key] = { agregar: [], sacar: [] };
                }
                
                if (checkbox.checked) {
                    if (!menuModule.ingredientesSeleccionados[key][ingType].includes(ingId)) {
                        menuModule.ingredientesSeleccionados[key][ingType].push(ingId);
                    }
                } else {
                    menuModule.ingredientesSeleccionados[key][ingType] = menuModule.ingredientesSeleccionados[key][ingType].filter(id => id !== ingId);
                }
                
                // Actualizar la clase 'seleccionado' del chip
                const chip = checkbox.closest('.chipIngrediente');
                if (chip) {
                    if (checkbox.checked) {
                        chip.classList.add('seleccionado');
                    } else {
                        chip.classList.remove('seleccionado');
                    }
                }
            }
        });
        
        // Eventos de la flechita para mostrar/ocultar ingredientes
        menuModule.opcionesDetalle?.addEventListener('click', (event) => {
            const headerIngredientes = event.target.closest('.headerIngredientes');
            if (headerIngredientes) {
                const contenidoIngredientes = headerIngredientes.nextElementSibling;
                const flechita = headerIngredientes.querySelector('.flechitaIngredientes');
                
                if (contenidoIngredientes) {
                    if (contenidoIngredientes.classList.contains('collapsed')) {
                        contenidoIngredientes.classList.remove('collapsed');
                        contenidoIngredientes.classList.add('expanded');
                        flechita.textContent = '▼';
                    } else {
                        contenidoIngredientes.classList.remove('expanded');
                        contenidoIngredientes.classList.add('collapsed');
                        flechita.textContent = '▶';
                    }
                }
                return; // No continuar con otros eventos
            }
            
            // Eventos de click en los chips (para dispositivos móviles)
            const chip = event.target.closest('.chipIngrediente');
            if (chip) {
                // No procesar si se hizo click en el checkbox directamente (ya tiene su propio evento)
                if (event.target.classList.contains('checkboxIngrediente')) return;
                
                const checkbox = chip.querySelector('.checkboxIngrediente');
                if (checkbox) {
                    event.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    // Disparar el evento change manualmente
                    const changeEvent = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(changeEvent);
                }
            }
        });
        
        // Eventos de las opciones del menú
        menuModule.opcionesDetalle?.addEventListener('click', (event) => {
            const botonOpcion = event.target.closest('.botonOpcion');
            if (botonOpcion) {
                if (promocion3PizzasActiva) {
                    // Agregar pizza a la promoción
                    agregarPizzaPromocion(botonOpcion.dataset.name, Number(botonOpcion.dataset.price));
                } else {
                    // Obtener ingredientes personalizados seleccionados
                    const itemName = botonOpcion.dataset.name;
                    const key = `${menuModule.menuActual}-${itemName}`;
                    const ingredientes = menuModule.ingredientesSeleccionados[key] || { agregar: [], sacar: [] };
                    
                    carritoModule.agregarAlCarrito(botonOpcion.dataset.name, Number(botonOpcion.dataset.price), ingredientes);
                    menuModule.cerrarDetalleMenu();
                }
            }
        });
        
        // Eventos del carrito (eliminar, confirmar)
        contenedorItemsCarrito.addEventListener('click', (event) => {
            const botonEliminar = event.target.closest('.botonEliminar');
            if (botonEliminar) {
                const nombre = botonEliminar.dataset.name;
                carritoModule.eliminarDelCarrito(nombre);
            }
            
            const botonConfirmar = event.target.closest('#confirm-order');
            if (botonConfirmar) {
                // Guardar carrito en localStorage
                localStorage.setItem('carritoPedido', JSON.stringify(carritoModule.carrito));
                // Redirigir a la página de checkout
                window.location.href = 'checkout.html';
            }
        });
        
        // Renderizar carrito inicial
        carritoModule.renderizarCarrito();
    }
    
    // Inicializar checkout si estamos en la página de checkout
    if (document.getElementById('formularioCheckout')) {
        checkoutModule.inicializarCheckout();
    }
});

// Función para iniciar la promoción de 3 pizzas
function iniciarPromocion3Pizzas(nombrePromocion, promocion) {
    promocion3PizzasActiva = true;
    pizzasSeleccionadas = [];
    
    // Abrir el menú de Pizzas
    abrirMenuPizzasPromocion(promocion);
}

// Función para abrir el menú de pizzas con indicador de promoción
function abrirMenuPizzasPromocion(promocion) {
    if (!menuModule.detalleMenu || !menuModule.tituloDetalle || !menuModule.opcionesDetalle) return;
    
    menuModule.tituloDetalle.textContent = `Selecciona 3 pizzas (${promocion.descripcion})`;
    
    const opciones = menuModule.opcionesMenu['Pizzas'] || [];
    
    menuModule.opcionesDetalle.innerHTML = '';
    const lista = document.createElement('div');
    lista.className = 'opcionesDetalleMenu';
    
    // Agregar contador de pizzas seleccionadas
    const contador = document.createElement('div');
    contador.className = 'contadorPromocion';
    contador.innerHTML = `<p style="color: var(--primario); margin-bottom: 10px;"><strong>Pizzas seleccionadas: <span id="contadorPizzas">0</span>/3</strong></p>`;
    lista.appendChild(contador);
    
    opciones.forEach(opcion => {
        const elemento = document.createElement('div');
        elemento.className = 'opcionMenu';
        const imagenHtml = opcion.image ? `<img src="${opcion.image}" alt="${opcion.name}" class="imagenOpcionMenu">` : '';
        elemento.innerHTML = `
            ${imagenHtml}
            <div class="contenidoOpcionMenu">
                <h4>${opcion.name}</h4>
                <p>${opcion.description}</p>
            </div>
            <div class="accionesOpcionMenu">
                <strong>${window.carritoModule ? carritoModule.formatearMoneda(opcion.price) : opcion.price}</strong>
                <button type="button" class="botonOpcion" data-name="${opcion.name}" data-price="${opcion.price}">Elegir</button>
            </div>
        `;
        lista.appendChild(elemento);
    });
    
    menuModule.opcionesDetalle.appendChild(lista);
    
    menuModule.detalleMenu.classList.add('show');
    menuModule.detalleMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

// Función para agregar pizza a la promoción
function agregarPizzaPromocion(nombre, precio) {
    // Permitir seleccionar la misma pizza múltiples veces
    if (pizzasSeleccionadas.length >= 3) return;
    
    pizzasSeleccionadas.push({ name: nombre, price: precio });
    
    // Actualizar contador
    const contadorElement = document.getElementById('contadorPizzas');
    if (contadorElement) {
        contadorElement.textContent = pizzasSeleccionadas.length;
    }
    
    // Si ya se seleccionaron las 3 pizzas, agregar al carrito
    if (pizzasSeleccionadas.length === 3) {
        // Ordenar pizzas por precio (de menor a mayor)
        pizzasSeleccionadas.sort((a, b) => a.price - b.price);
        
        // El precio final es el de la pizza más barata
        const precioFinal = pizzasSeleccionadas[0].price;
        const nombresPizzas = pizzasSeleccionadas.map(p => p.name).join(', ');
        
        carritoModule.carrito.push({
            name: `3 Pizzas (${nombresPizzas})`,
            price: precioFinal,
            quantity: 1,
            esPromocion3Pizzas: true,
            pizzas: pizzasSeleccionadas
        });
        
        // Guardar en localStorage
        localStorage.setItem('carritoPedido', JSON.stringify(carritoModule.carrito));
        
        carritoModule.renderizarCarrito();
        carritoModule.alternarCarrito(true);
        
        // Resetear estado
        promocion3PizzasActiva = false;
        pizzasSeleccionadas = [];
        
        menuModule.cerrarDetalleMenu();
    }
}

// Función para cancelar la promoción
function cancelarPromocion3Pizzas() {
    promocion3PizzasActiva = false;
    pizzasSeleccionadas = [];
}