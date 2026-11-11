# Contratación · Secretaría de Cultura · Valle del Cauca

Tablero interactivo de la contratación de la Secretaría de Cultura de la Gobernación del Valle del Cauca, desde el 1 de enero de 2024: **¿en qué se ha gastado la plata?**

**Ver el tablero:** https://jlzmontenegro.github.io/contratacion-cultura-valle/

## Qué incluye

- «¿En qué se ha gastado la plata?»: 8 rubros y 20 categorías leídos del objeto de cada contrato (eventos y circulación artística, patrimonio y museos, bibliotecas, personal por OPS, estímulos, formación, comunidades étnicas y otros).
- Gráficos de torta (rubros, naturaleza del contrato, estado, modificaciones y adiciones) y de barras (top 15 de contratistas, año, mes, proyecto de inversión, tipo según SECOP, modalidad, origen de los recursos), todos en valor o en número de contratos, en cifras o en porcentaje.
- Filtros que se combinan (varios valores por filtro) y gráficos que filtran al tocarlos.
- Tabla con columnas a elección: nº de contrato, contratista, objeto, valor, firma, inicio, fin, adiciones y modificaciones (con el detalle de cada modificación registrada en SECOP II), más categoría, estado, supervisor y otras. Exporta a CSV y PDF.
- Diseño para celular primero: en pantallas pequeñas la tabla se lee como tarjetas.

## Datos

- **Fuente:** SECOP II · Contratos Electrónicos (`jbjy-vk9h`) en datos.gov.co, entidad `SECRETARIA DE CULTURA VALLE`, firmados desde 2024-01-01.
- **Depuración:** una fila por contrato; se excluyen los estados Cancelado y Borrador (no hubo ninguno en el periodo) y los contratos registrados dos veces con otro ID (5 casos, $94 M).
- **Modificaciones:** SECOP II · Modificaciones a contratos (`cb9c-h8sn`). **Adiciones:** valor del contrato menos el precio base del proceso (SECOP II · Procesos, `p6dx-8zbt`), porque SECOP II no publica el valor inicial.
- Cobertura verificada contra SECOP Integrado (`rpmr-utcd`).
- La página consulta la API al abrirse y se actualiza sola; si no hay conexión usa `datos.js`. Las reglas de depuración y categorización están en `nucleo.js`.
