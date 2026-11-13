# nexo.pyme 🚀
> Sistema operativo para la gestión y optimización de operaciones en pequeñas y medianas empresas.

`nexo.pyme` es una aplicación web frontend ligera y modular diseñada para centralizar tareas administrativas cotidianas de forma rápida, intuitiva y sin dependencias pesadas de librerías externas.

---

## 🛠️ Módulos Principales

1. **Control Financiero (Conciliación de caja):**
   - Compara registros de ventas del punto de venta con los abonos bancarios recibidos.
   - Algoritmo de coincidencia con una ventana de tolerancia de hasta $\pm3$ días.
   - Cálculo automático de faltantes, sobrantes y descuadre neto.

2. **Operación en Tienda (Etiquetas de góndola):**
   - Diseño de etiquetas de precios listas para imprimir.
   - Generación dinámica de códigos de barras visuales por SKU.
   - Control de inventario visual optimizado para tiendas físicas.

3. **Abastecimiento (Validador de proveedores):**
   - Carga y revisión de listas de precios de proveedores.
   - Detección automática de SKUs duplicados y precios inválidos ($\le 0$).
   - Diagnóstico visual de errores e inconsistencias antes de actualizar el catálogo.

---

## 📂 Estructura del Proyecto

El proyecto está organizado de forma limpia en tres archivos principales:

```text
/
├── index.html    # Estructura principal de la interfaz y vistas
├── styles.css    # Estilos modernos, variables CSS y diseño responsivo
└── script.js     # Lógica de la aplicación, estado global y algoritmos
