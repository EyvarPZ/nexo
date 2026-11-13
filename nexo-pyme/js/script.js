// --- 1. VARIABLES GLOBALES DE LA APLICACIÓN ---
var pestanaActual = 'cash';
var ventas = [];
var depositos = [];
var etiquetas = [];
var proveedores = [];
var listavalidada = false;
var resultadoAnalisis = null;

// --- 2. FUNCIONES AUXILIARES BÁSICAS ---
function formatearMoneda(cantidad) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cantidad);
}

function obtenerIconoSVG(nombre) {
    if (nombre === 'receipt') {
        return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';
    } else if (nombre === 'bank') {
        return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18m-13 5h3"/></svg>';
    } else if (nombre === 'box') {
        return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5m-18 0v9l9 5 9-5V8m-9 5v9"/></svg>';
    } else if (nombre === 'check') {
        return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4L19 6"/></svg>';
    } else if (nombre === 'alert') {
        return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></svg>';
    }
    return '';
}

// --- 3. NAVEGACIÓN ENTRE PESTAÑAS ---
var botonesNavegacion = document.querySelectorAll('.nav button');

for (var i = 0; i < botonesNavegacion.length; i++) {
    botonesNavegacion[i].addEventListener('click', function() {
        for (var j = 0; j < botonesNavegacion.length; j++) {
            botonesNavegacion[j].classList.remove('active');
            botonesNavegacion[j].removeAttribute('aria-current');
        }
        this.classList.add('active');
        this.setAttribute('aria-current', 'page');
        
        pestanaActual = this.getAttribute('data-tab');
        renderizarAplicacion();
    });
}

// --- 4. FUNCIÓN PRINCIPAL DE RENDERIZADO ---
function renderizarAplicacion() {
    var contenedorApp = document.getElementById('app');
    
    if (pestanaActual === 'cash') {
        contenedorApp.innerHTML = generarVistaConciliacion();
    } else if (pestanaActual === 'labels') {
        contenedorApp.innerHTML = generarVistaEtiquetas();
    } else if (pestanaActual === 'suppliers') {
        contenedorApp.innerHTML = generarVistaProveedores();
    }
}

// --- 5. VISTA 1: CONCILIACIÓN DE CAJA ---
function generarVistaConciliacion() {
    var htmlVentas = generarTablaTransacciones('Ventas del sistema', 'Movimientos registrados en tu punto de venta', 'sale', ventas);
    var htmlDepositos = generarTablaTransacciones('Abonos bancarios', 'Depósitos recibidos en tu cuenta', 'deposit', depositos);
    
    var htmlResultados = '';
    if (resultadoAnalisis !== null) {
        htmlResultados = generarVistaResultados();
    }

    return `
        <header class="section-head">
            <div class="eyebrow">Control financiero · 01</div>
            <h1>Conciliación de caja</h1>
            <p>Compara las ventas registradas con los abonos bancarios y detecta diferencias en segundos.</p>
        </header>
        <div class="columns">
            ${htmlVentas}
            ${htmlDepositos}
        </div>
        <div class="action-bar">
            <div>
                <strong>¿Todo listo para conciliar?</strong>
                <p>Se buscarán coincidencias de monto con una tolerancia de hasta 3 días.</p>
            </div>
            <button class="btn primary" type="button" onclick="ejecutarConciliacion()">✧ Ejecutar algoritmo de conciliación</button>
        </div>
        ${htmlResultados}
    `;
}

function generarTablaTransacciones(titulo, descripcion, tipo, registros) {
    var esVenta = (tipo === 'sale');
    var placeholderId = esVenta ? 'ID de venta' : 'ID de depósito';
    var filasHTML = '';

    for (var i = 0; i < registros.length; i++) {
        var reg = registros[i];
        filasHTML += `
            <tr>
                <td class="mono">${reg.id}</td>
                <td>${reg.date}</td>
                <td class="right mono">${formatearMoneda(reg.amount)}</td>
            </tr>
        `;
    }

    var contenidoTabla = '';
    if (registros.length > 0) {
        contenidoTabla = `
            <div class="table-scroll">
                <table>
                    <thead>
                        <tr><th>ID</th><th>Fecha</th><th class="right">Monto (MXN)</th></tr>
                    </thead>
                    <tbody>
                        ${filasHTML}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        var iconoVacio = esVenta ? 'receipt' : 'bank';
        contenidoTabla = `
            <div class="empty">
                <span class="empty-icon">${obtenerIconoSVG(iconoVacio)}</span>
                <strong>Sin movimientos todavía</strong>
                <p>Agrega tus registros para comenzar la conciliación.</p>
            </div>
        `;
    }

    return `
        <section class="panel">
            <div class="panel-head">
                <div>
                    <h2>${titulo}</h2>
                    <p>${descripcion}</p>
                </div>
                <span class="count">${registros.length} registros</span>
            </div>
            <form class="fields" onsubmit="agregarTransaccion(event, '${tipo}')">
                <label class="field">
                    <span class="field-label">ID de operación</span>
                    <span class="control"><input name="id" type="text"></span>
                </label>
                <label class="field">
                    <span class="field-label">Fecha</span>
                    <span class="control"><input name="date" type="date" required></span>
                </label>
                <label class="field">
                    <span class="field-label">Monto</span>
                    <span class="control"><span class="prefix">$</span><input name="amount" type="number" step="0.01" min="0" placeholder="0.00" required></span>
                </label>
                <button class="btn primary" type="submit">＋ Agregar</button>
            </form>
            ${contenidoTabla}
        </section>
    `;
}

function generarVistaResultados() {
    var res = resultadoAnalisis;
    var claseNeto = (res.net === 0) ? 'tone-green' : 'tone-yellow';
    var fondoNeto = (res.net === 0) ? 'bg-green' : 'bg-yellow';
    var iconoNeto = (res.net === 0) ? '✓' : '!';
    var notaNeto = (res.net === 0) ? 'Caja balanceada' : 'Sobrante menos faltante';

    return `
        <section class="results">
            <div class="result-head">
                ${obtenerIconoSVG('check')} Resultado del análisis 
                <span class="result-meta">${res.matched} coincidencias · ventana ±3 días</span>
            </div>
            <div class="kpis">
                <article class="kpi">
                    <div class="kpi-label">Faltante<span class="kpi-icon bg-red tone-red">↓</span></div>
                    <div class="kpi-value tone-red mono">${formatearMoneda(res.missing)}</div>
                    <div class="kpi-note">Ventas sin abono</div>
                </article>
                <article class="kpi">
                    <div class="kpi-label">Sobrante<span class="kpi-icon bg-yellow tone-yellow">↑</span></div>
                    <div class="kpi-value tone-yellow mono">${formatearMoneda(res.extra)}</div>
                    <div class="kpi-note">Abonos sin venta</div>
                </article>
                <article class="kpi">
                    <div class="kpi-label">Descuadre neto<span class="kpi-icon ${fondoNeto} ${claseNeto}">${iconoNeto}</span></div>
                    <div class="kpi-value ${claseNeto} mono">${formatearMoneda(res.net)}</div>
                    <div class="kpi-note">${notaNeto}</div>
                </article>
            </div>
        </section>
    `;
}

// --- 6. VISTA 2: ETIQUETAS DE GÓNDOLA ---
function generarVistaEtiquetas() {
    var tarjetasHTML = '';
    for (var i = 0; i < etiquetas.length; i++) {
        var item = etiquetas[i];
        var lineasCodigo = '';
        for (var b = 0; b < 38; b++) {
            var opacidad = ((b + item.sku.length) % 7 === 0) ? 0.45 : 1;
            lineasCodigo += `<i style="opacity:${opacidad}"></i>`;
        }

        tarjetasHTML += `
            <article class="product-label">
                <div class="label-top">
                    <span class="sku-tag">${item.sku}</span>
                    <button class="remove" type="button" onclick="eliminarEtiqueta(${i})">×</button>
                </div>
                <h3>${item.name}</h3>
                <div class="price-caption">Precio de venta</div>
                <div class="label-price">${formatearMoneda(item.price)}</div>
                <div class="barcode-row">
                    <div class="barcode">${lineasCodigo}</div>
                    🖨️
                </div>
            </article>
        `;
    }

    var seccionGrilla = '';
    if (etiquetas.length > 0) {
        seccionGrilla = `<div class="label-grid">${tarjetasHTML}</div>`;
    } else {
        seccionGrilla = `
            <section class="panel">
                <div class="empty">
                    <span class="empty-icon">${obtenerIconoSVG('box')}</span>
                    <strong>Tu grilla está lista</strong>
                    <p>Agrega productos para generar sus etiquetas de góndola.</p>
                </div>
            </section>
        `;
    }

    return `
        <header class="section-head">
            <div class="eyebrow">Operación en tienda · 02</div>
            <h1>Etiquetas de góndola</h1>
            <p>Diseña etiquetas de precio listas para imprimir y mantener cada producto bien identificado.</p>
        </header>
        <section class="panel" style="margin-bottom:20px">
            <form class="wide-form" onsubmit="agregarEtiqueta(event)">
                <label class="field">
                    <span class="field-label">Nombre del producto</span>
                    <span class="control"><input name="name" type="text" required></span>
                </label>
                <label class="field">
                    <span class="field-label">SKU</span>
                    <span class="control"><input name="sku" type="text" required></span>
                </label>
                <label class="field">
                    <span class="field-label">Precio de venta</span>
                    <span class="control"><span class="prefix">$</span><input name="price" type="number" step="0.01" min="0" placeholder="0.00" required></span>
                </label>
                <button class="btn primary" type="submit">＋ Añadir etiqueta</button>
            </form>
        </section>
        <div class="subhead" style="padding:0 0 12px;border:0">
            <h2>🖨️ &nbsp;Vista de impresión</h2>
            <span class="count">${etiquetas.length} productos</span>
        </div>
        ${seccionGrilla}
    `;
}

// --- 7. VISTA 3: VALIDADOR DE PROVEEDORES ---
function generarVistaProveedores() {
    var tablaProveedoresHTML = '';
    if (proveedores.length > 0) {
        tablaProveedoresHTML = generarTablaProveedores();
    } else {
        tablaProveedoresHTML = `
            <div class="empty">
                <span class="empty-icon">${obtenerIconoSVG('receipt')}</span>
                <strong>No hay productos en la lista</strong>
                <p>Agrega los artículos de tu proveedor para revisar su calidad.</p>
            </div>
        `;
    }

    var pieDiagnostico = '';
    if (listavalidada && proveedores.length > 0) {
        pieDiagnostico = generarPieDiagnostico();
    }

    return `
        <header class="section-head">
            <div class="eyebrow">Abastecimiento · 03</div>
            <h1>Validador de proveedores</h1>
            <p>Revisa tu lista de precios antes de actualizar el catálogo: detecta SKU repetidos y precios inválidos.</p>
        </header>
        <section class="panel" style="margin-bottom:20px">
            <form class="supplier-form" onsubmit="agregarProveedor(event)">
                <label class="field">
                    <span class="field-label">SKU</span>
                    <span class="control"><input name="sku" type="text" required></span>
                </label>
                <label class="field">
                    <span class="field-label">Nombre del producto</span>
                    <span class="control"><input name="name" type="text" required></span>
                </label>
                <label class="field">
                    <span class="field-label">Precio proveedor</span>
                    <span class="control"><span class="prefix">$</span><input name="price" type="number" step="0.01" min="0" placeholder="0.00" required></span>
                </label>
                <label class="field">
                    <span class="field-label">Categoría</span>
                    <span class="control"><input name="category" type="text"></span>
                </label>
                <button class="btn primary" type="submit">＋ Agregar</button>
            </form>
        </section>
        <section class="panel">
            <div class="subhead">
                <div>
                    <h2>Lista de precios</h2>
                    <p>${proveedores.length} productos cargados</p>
                </div>
                <button class="btn primary" type="button" onclick="validarProveedores()" ${proveedores.length === 0 ? 'disabled' : ''}>✓ Validar lista de precios</button>
            </div>
            ${tablaProveedoresHTML}
            ${pieDiagnostico}
        </section>
    `;
}

function generarTablaProveedores() {
    var filasHTML = '';
    
    for (var i = 0; i < proveedores.length; i++) {
        var r = proveedores[i];
        var esDuplicado = false;
        for (var j = 0; j < proveedores.length; j++) {
            if (i !== j && proveedores[j].sku.trim().toLowerCase() === r.sku.trim().toLowerCase()) {
                esDuplicado = true;
                break;
            }
        }
        
        var esPrecioInvalido = (r.price <= 0);
        var esValido = (!esDuplicado && !esPrecioInvalido);
        
        var textoDiagnostico = '';
        if (!listavalidada) {
            textoDiagnostico = '<span style="color:#666975">Pendiente</span>';
        } else if (esValido) {
            textoDiagnostico = '<span class="badge ok">✓ Válido</span>';
        } else {
            var badges = '';
            if (esDuplicado) badges += '<span class="badge warn">! SKU duplicado</span> ';
            if (esPrecioInvalido) badges += '<span class="badge error">! Precio inválido</span>';
            textoDiagnostico = badges;
        }

        var clasePrecio = esPrecioInvalido ? 'tone-red' : '';
        var categoriaTexto = r.category ? r.category : '—';

        filasHTML += `
            <tr>
                <td class="mono">${r.sku}</td>
                <td>${r.name}</td>
                <td>${categoriaTexto}</td>
                <td class="right mono ${clasePrecio}">${formatearMoneda(r.price)}</td>
                <td>${textoDiagnostico}</td>
            </tr>
        `;
    }

    return `
        <div class="table-scroll">
            <table>
                <thead>
                    <tr><th>SKU</th><th>Producto</th><th>Categoría</th><th class="right">Precio</th><th>Diagnóstico</th></tr>
                </thead>
                <tbody>
                    ${filasHTML}
                </tbody>
            </table>
        </div>
    `;
}

function generarPieDiagnostico() {
    var cantidadErrores = 0;
    
    for (var i = 0; i < proveedores.length; i++) {
        var r = proveedores[i];
        var esDuplicado = false;
        for (var j = 0; j < proveedores.length; j++) {
            if (i !== j && proveedores[j].sku.trim().toLowerCase() === r.sku.trim().toLowerCase()) {
                esDuplicado = true;
                break;
            }
        }
        if (esDuplicado || r.price <= 0) {
            cantidadErrores++;
        }
    }

    var claseDiagnostico = (cantidadErrores > 0) ? 'issue' : 'good';
    var iconoDiag = (cantidadErrores > 0) ? obtenerIconoSVG('alert') : obtenerIconoSVG('check');
    var mensajeDiag = (cantidadErrores > 0) ? (cantidadErrores + ' producto(s) requieren atención.') : 'Lista validada. No se encontraron inconsistencias.';

    return `
        <div class="diagnostic ${claseDiagnostico}">
            ${iconoDiag} ${mensajeDiag}
        </div>
    `;
}

// --- 8. MANEJADORES DE EVENTOS Y ACCIONES ---
function agregarTransaccion(event, tipo) {
    event.preventDefault();
    var formulario = event.target;
    var idOperacion = formulario.elements['id'].value.trim();
    var fechaOperacion = formulario.elements['date'].value;
    var montoOperacion = parseFloat(formulario.elements['amount'].value);

    if (!idOperacion || !fechaOperacion || isNaN(montoOperacion)) return;

    var nuevoMovimiento = { id: idOperacion, date: fechaOperacion, amount: montoOperacion };

    if (tipo === 'sale') {
        ventas.push(nuevoMovimiento);
    } else {
        depositos.push(nuevoMovimiento);
    }

    resultadoAnalisis = null;
    renderizarAplicacion();
}

function agregarEtiqueta(event) {
    event.preventDefault();
    var formulario = event.target;
    var nombreProd = formulario.elements['name'].value.trim();
    var skuProd = formulario.elements['sku'].value.trim();
    var precioProd = parseFloat(formulario.elements['price'].value);

    if (!nombreProd || !skuProd || isNaN(precioProd)) return;

    etiquetas.push({ name: nombreProd, sku: skuProd, price: precioProd });
    renderizarAplicacion();
}

function eliminarEtiqueta(indice) {
    etiquetas.splice(indice, 1);
    renderizarAplicacion();
}

function agregarProveedor(event) {
    event.preventDefault();
    var formulario = event.target;
    var skuProv = formulario.elements['sku'].value.trim();
    var nombreProv = formulario.elements['name'].value.trim();
    var precioProv = parseFloat(formulario.elements['price'].value);
    var categoriaProv = formulario.elements['category'].value.trim();

    if (!skuProv || !nombreProv || isNaN(precioProv)) return;

    proveedores.push({ sku: skuProv, name: nombreProv, price: precioProv, category: categoriaProv });
    listavalidada = false;
    renderizarAplicacion();
}

function ejecutarConciliacion() {
    var depositosUsados = [];
    var coincidencias = 0;
    var faltanteTotal = 0;

    for (var i = 0; i < ventas.length; i++) {
        var ventaActual = ventas[i];
        var encontrada = false;

        for (var j = 0; j < depositos.length; j++) {
            var yaUsado = false;
            for (var u = 0; u < depositosUsados.length; u++) {
                if (depositosUsados[u] === j) {
                    yaUsado = true;
                    break;
                }
            }

            if (!yaUsado) {
                var dep = depositos[j];
                var fechaVenta = new Date(ventaActual.date + 'T12:00:00');
                var fechaDep = new Date(dep.date + 'T12:00:00');
                var diferenciaDias = Math.abs((fechaDep - fechaVenta) / (1000 * 60 * 60 * 24));
                var diferenciaMonto = Math.abs(dep.amount - ventaActual.amount);

                if (diferenciaDias <= 3 && diferenciaMonto < 0.01) {
                    depositosUsados.push(j);
                    coincidencias++;
                    encontrada = true;
                    break;
                }
            }
        }

        if (!encontrada) {
            faltanteTotal += ventaActual.amount;
        }
    }

    var sobranteTotal = 0;
    for (var k = 0; k < depositos.length; k++) {
        var estaUsado = false;
        for (var m = 0; m < depositosUsados.length; m++) {
            if (depositosUsados[m] === k) {
                estaUsado = true;
                break;
            }
        }
        if (!estaUsado) {
            sobranteTotal += depositos[k].amount;
        }
    }

    var descuadreNeto = sobranteTotal - faltanteTotal;

    resultadoAnalisis = {
        missing: faltanteTotal,
        extra: sobranteTotal,
        net: descuadreNeto,
        matched: coincidencias
    };

    renderizarAplicacion();
}

function validarProveedores() {
    listavalidada = true;
    renderizarAplicacion();
}

// --- 9. INICIALIZACIÓN ---
renderizarAplicacion();
