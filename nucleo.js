/* ==================================================================
   NÚCLEO DEL TABLERO · Secretaría de Cultura del Valle
   Depuración (duplicados, cancelados, borradores) y categorización
   por lectura del objeto. Se usa igual para los datos locales
   (datos.js) y para los que llegan en vivo desde datos.gov.co.
   Las reglas son editables: la primera que coincide gana.
   ================================================================== */
(function (G) {
  'use strict';
  const norm = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const N = v => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };
  const S = v => v == null ? '' : String(v).trim();
  const ND = v => /^(no definido|sin descripcion|sin descripción)$/i.test(S(v)) ? '' : S(v);

  /* ---------- 1. RUBROS (orden y color fijos: el color sigue al rubro) ---------- */
  const RUBROS = [
    { k: 'Eventos y circulación artística', color: '#2a78d6' },
    { k: 'Personal por prestación de servicios (OPS)', color: '#eb6834' },
    { k: 'Patrimonio cultural y museos', color: '#1baf7a' },
    { k: 'Bibliotecas y lectura', color: '#eda100' },
    { k: 'Estímulos y convocatorias', color: '#e87ba4' },
    { k: 'Formación artística', color: '#008300' },
    { k: 'Comunidades étnicas', color: '#6250d6' },
    { k: 'Otros: municipios, sistema de cultura y oficina', color: '#898781' },
  ];

  /* ---------- 2. CATEGORÍAS: [categoría, rubro, palabras clave] ----------
     NO se usan palabras del nombre de la entidad («cultura», «valle»,
     «secretaría») ni el nombre de los proyectos de inversión, que se
     repiten en casi todos los objetos («fomento; estímulos; promoción…»). */
  const R = RUBROS.map(r => r.k);
  const REGLAS = [
    ['Biblioteca Departamental y lectura', R[3], ['biblioteca', 'plan de lectura', 'lectura y escritura']],
    ['Museos y centros patrimoniales (INCIVA)', R[2], ['inciva', 'centros patrimoniales', 'bienes patrimoniales', 'patrimonio cultural y natural']],
    ['Patrimonio inmaterial, oficios y saberes', R[2], ['patrimonio cultural inmaterial', 'patrimonio inmaterial', 'asuntos patrimoniales', 'viche', 'vigias del patrimonio', 'conservacion del patrimonio', 'patrimonio']],
    ['Parteras tradicionales', R[6], ['parteras']],
    ['Pueblos indígenas', R[6], ['indigena', 'cabildo', 'pueblo nasa', 'wounaan', 'orivac', 'kowondev']],
    ['Comunidades afrocolombianas', R[6], ['afrocolombian', 'afrodescendiente', 'comunidades negras', 'palenquer', 'raizal']],
    ['Proyectos culturales municipales (INC)', R[7], ['proyecto inc', 'impuesto nacional al consumo']],
    ['Música: Plan Departamental y conciertos', R[0], ['plan departamental de musica', 'musica sinfonica', 'conciertos', 'formacion musical']],
    ['Profesionalización de artistas', R[5], ['profesionalizacion', 'semestre']],
    ['Salsa: escuelas de baile', R[5], ['salsa', 'escuelas de baile']],
    ['Talleres y formación artística', R[5], ['talleres', 'proceso de formacion', 'experimentacion artistica', 'formacion en ', 'proyectos audiovisuales']],
    ['Premio Vida y Colección Autores Vallecaucanos', R[4], ['premio vida', 'coleccion autores']],
    ['Estímulos a artistas y gestores', R[4], ['entrega de estimulos', 'estimulos e incentivos', 'estimular iniciativas', 'apoyar y estimular', 'a traves de estimulos', 'convocatoria', 'becas']],
    ['Fortalecimiento del sistema departamental de cultura', R[7], ['participacion del sistema departamental', 'articulacion del sistema departamental', 'institucionalidad']],
    ['Viernes de la Cultura', R[0], ['viernes de la cultura']],
    ['Oferta artística y cultural en los municipios', R[0], ['acceso a los bienes y servicios artisticos', 'manifestaciones culturales tradicionales', 'difusion y circulacion']],
    ['Eventos y manifestaciones artísticas', R[0], ['eventos', 'manifestaciones artisticas', 'circulacion artistica', 'encuentro', 'festival', 'practicas culturales', 'procesos artisticos y culturales', 'actividades culturales']],
    ['Elementos de oficina, cafetería y aseo', R[7], ['insumos de oficina', 'elementos de oficina', 'cafeteria', 'aseo', 'papeleria']],
  ];
  const OPS_PROF = 'OPS · Profesionales', OPS_APOYO = 'OPS · Apoyo a la gestión';
  const esOPS = txt => /prestar (los )?servicios (profesionales|de apoyo)/.test(txt);

  function categorizar(c) {
    const txt = norm(c.objeto + ' ' + c.desc);
    if (esOPS(txt.slice(0, 120))) return /apoyo a (la|al) gestion|servicios de apoyo/.test(txt.slice(0, 120)) ? OPS_APOYO : OPS_PROF;
    for (const [cat, , kws] of REGLAS) for (const kw of kws) if (txt.includes(kw)) return cat;
    if (/municipio|alcaldia/.test(norm(c.prov))) return 'Proyectos culturales municipales (INC)';
    return 'Otros convenios culturales';
  }
  const RUBRO_DE = Object.fromEntries(REGLAS.map(([cat, rub]) => [cat, rub]));
  RUBRO_DE[OPS_PROF] = R[1]; RUBRO_DE[OPS_APOYO] = R[1]; RUBRO_DE['Otros convenios culturales'] = R[0];
  const rubroDe = cat => RUBRO_DE[cat] || R[7];
  const colorRubro = k => (RUBROS.find(r => r.k === k) || RUBROS[RUBROS.length - 1]).color;

  /* ---------- 3. NATURALEZA DEL CONTRATO (leída del objeto, no del «tipo» de SECOP) ---------- */
  const NATURALEZAS = [
    { k: 'Prestación de servicios con persona natural (OPS)', color: '#eb6834' },
    { k: 'Convenio con entidad pública o mixta (interadministrativo)', color: '#2a78d6' },
    { k: 'Convenio con entidad privada sin ánimo de lucro', color: '#1baf7a' },
    { k: 'Compra de bienes / suministros', color: '#eda100' },
    { k: 'Obra pública', color: '#e87ba4' },
  ];
  // Entidades públicas o mixtas que aparecen como contratistas (lista editable)
  const PUBLICAS = /recreavalle|inciva|biblioteca departamental|bellas artes|fondo mixto|municipio|alcaldia|gobernacion|universidad del valle|corporacion para el desarrollo social y cultural/;
  function naturaleza(c) {
    const txt = norm(c.objeto), prov = norm(c.prov), just = norm(c.justif);
    if (c.cat.startsWith('OPS')) return NATURALEZAS[0].k;
    if (/adquirir|adquisicion|compra|suministro de/.test(txt.slice(0, 60))) return NATURALEZAS[3].k;
    if (/^(construir|construccion|obra|mejoramiento|adecuacion|mantenimiento de la infraestructura)/.test(txt)) return NATURALEZAS[4].k;
    if (PUBLICAS.test(prov) || (just.includes('interadministrativ') && !/asociacion|fundacion|consejo|cabildo|corporacion|kowondev|cun\b/.test(prov))) return NATURALEZAS[1].k;
    return NATURALEZAS[2].k;
  }

  /* ---------- 4. PROYECTO DE INVERSIÓN que cita el objeto ---------- */
  const PROYECTOS = [
    ['Apoyo a los procesos de fomento, estímulos, promoción y circulación de la cultura', ['apoyo a los procesos de fomento', 'apoyo los procesos de fomento', 'denominado; apoyo a los procesos']],
    ['Fortalecimiento de los procesos de fomento, estímulos, promoción y circulación', ['fortalecimiento de los procesos de fomento']],
    ['Fortalecimiento del sistema departamental de cultura', ['fortalecimiento del sistema departamental de cultura', 'sistema departamental de cultura']],
    ['Fortalecimiento de los derechos culturales', ['derechos culturales']],
    ['Apoyo, estímulos e incentivos para el arte y la cultura', ['estimulos e incentivos']],
    ['Plan Departamental de Música', ['plan departamental de musica']],
    ['Viernes de la Cultura (Ordenanza 386 de 2014)', ['viernes de la cultura']],
    ['Impuesto Nacional al Consumo (INC)', ['proyecto inc']],
  ];
  function proyecto(c) {
    const txt = norm(c.objeto + ' ' + c.desc);
    for (const [p, kws] of PROYECTOS) for (const kw of kws) if (txt.includes(kw)) return p;
    return 'No lo nombra';
  }

  /* ---------- 5. MODIFICACIONES (cb9c-h8sn) ---------- */
  const MOD_NOMBRE = { 'Modificacion General': 'Modificación general', 'Adicion en el valor': 'Adición en valor', 'Reduccion en el valor': 'Reducción en valor', 'Suspensión': 'Suspensión', 'Reactivación': 'Reactivación', 'Cesion': 'Cesión', 'Extension': 'Prórroga', 'Conclusion': 'Cierre / liquidación', 'No definido': 'Sin tipo (terminación, liquidación u otra)' };
  // Cuentan como «modificación» las que cambian el contrato; el cierre y los registros sin tipo no.
  const ES_MODIF = t => !/^(Conclusion|No definido)$/.test(t);

  /* ---------- 6. ESTADOS ---------- */
  const EXCLUIR_ESTADO = /^(borrador|cancelado|anulado)$/;
  const NOMBRE_ESTADO = { 'aprobado': 'Aprobado (firmado)', 'activo': 'Activo', 'en ejecucion': 'En ejecución', 'modificado': 'Modificado', 'suspendido': 'Suspendido', 'terminado': 'Terminado', 'cerrado': 'Cerrado', 'cedido': 'Cedido', 'liquidado': 'Liquidado', 'enviado proveedor': 'Enviado al contratista (sin firma)' };
  // Al elegir entre dos registros del mismo contrato, gana el de estado más «vivo»
  const RANGO_ESTADO = e => ({ 'aprobado': 1, 'terminado': 2, 'enviado proveedor': 0 })[norm(e)] ?? 3;

  const FUENTES = [
    ['Presupuesto General de la Nación', 'presupuesto_general_de_la_nacion_pgn'],
    ['Sistema General de Participaciones', 'sistema_general_de_participaciones'],
    ['Sistema General de Regalías', 'sistema_general_de_regal_as'],
    ['Recursos propios (Gobernación)', 'recursos_propios_alcald_as_gobernaciones_y_resguardos_ind_genas_'],
    ['Recursos de crédito', 'recursos_de_credito'],
    ['Otros recursos propios', 'recursos_propios'],
  ];

  function mapContrato(r) {
    const c = {
      id: S(r.id_contrato), ref: S(r.referencia_del_contrato), proc: S(r.proceso_de_compra), estado0: S(r.estado_contrato),
      tipo: S(r.tipo_de_contrato), modalidad: S(r.modalidad_de_contratacion), justif: ND(r.justificacion_modalidad_de),
      objeto: S(r.objeto_del_contrato), desc: norm(r.descripcion_del_proceso) === norm(r.objeto_del_contrato) ? '' : S(r.descripcion_del_proceso),
      prov: S(r.proveedor_adjudicado).replace(/\s+/g, ' '), doc: S(r.documento_proveedor), tdoc: ND(r.tipodocproveedor),
      pyme: /^si/i.test(S(r.es_pyme)) ? 1 : 0, valor: N(r.valor_del_contrato),
      firma: S(r.fecha_de_firma).slice(0, 10), inicio: S(r.fecha_de_inicio_del_contrato).slice(0, 10), fin: S(r.fecha_de_fin_del_contrato).slice(0, 10),
      unspsc: S(r.codigo_de_categoria_principal), superv: ND(r.nombre_supervisor), ordenador: ND(r.nombre_ordenador_del_gasto),
      repLegal: ND(r.nombre_representante_legal), diasAd: N(r.dias_adicionados), duracion: ND(r.duraci_n_del_contrato),
      liquidado: /^si/i.test(S(r.liquidaci_n)) ? 'Sí' : 'No', destino: ND(r.destino_gasto), act: S(r.ultima_actualizacion),
      url: S(r.urlproceso && r.urlproceso.url !== undefined ? r.urlproceso.url : r.urlproceso),
    };
    FUENTES.forEach(([, k], i) => { c['f' + i] = N(r[k]); });
    return c;
  }

  const dias = (a, b) => Math.abs((new Date(a) - new Date(b)) / 864e5);

  /* ---------- 7. DEPURACIÓN + ENRIQUECIMIENTO ----------
     crudos: filas de jbjy-vk9h · base: {proceso_de_compra: precio base} (p6dx-8zbt)
     mods: {id_contrato: [[tipo, fecha, descripción], …]} (cb9c-h8sn)          */
  function construir(crudos, base, mods, desde) {
    base = base || {}; mods = mods || {};
    const excluidos = [];
    const sale = (c, motivo, queda) => excluidos.push({ ...c, motivo, queda: queda ? queda.id : '' });
    // a) una fila por id_contrato (la de última actualización)
    const porId = new Map();
    crudos.map(mapContrato).forEach(c => {
      const o = porId.get(c.id);
      if (!o) { porId.set(c.id, c); return; }
      const [gana, pierde] = c.act > o.act ? [c, o] : [o, c];
      porId.set(c.id, gana); sale(pierde, 'ID de contrato repetido', gana);
    });
    // b) estados excluidos (cancelado / borrador)
    let vivos = [];
    porId.forEach(c => { EXCLUIR_ESTADO.test(norm(c.estado0)) ? sale(c, 'Estado ' + c.estado0.toLowerCase()) : vivos.push(c); });
    // c) mismo contrato registrado dos veces con otro ID: mismo documento del contratista,
    //    mismo valor y mismo objeto, firmados con 10 días o menos de diferencia
    //    (los contratos sucesivos de una misma persona se firman con 54 días o más de distancia).
    const grupos = new Map();
    vivos.forEach(c => { const k = [c.doc || norm(c.prov), c.valor, norm(c.objeto)].join('|'); (grupos.get(k) || grupos.set(k, []).get(k)).push(c); });
    const fuera = new Set();
    grupos.forEach(L => {
      if (L.length < 2) return;
      L.sort((a, b) => a.firma.localeCompare(b.firma));
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
        const a = L[i], b = L[j];
        if (fuera.has(a.id) || fuera.has(b.id) || !a.firma || !b.firma || dias(a.firma, b.firma) > 10) continue;
        const ra = RANGO_ESTADO(a.estado0), rb = RANGO_ESTADO(b.estado0);
        const [gana, pierde] = ra !== rb ? (ra > rb ? [a, b] : [b, a]) : [b, a]; // empate: el más reciente
        fuera.add(pierde.id);
        sale(pierde, `Duplicado: mismo contratista, valor y objeto que ${gana.ref || gana.id}, firmado ${Math.round(dias(a.firma, b.firma))} día(s) ${pierde === a ? 'antes' : 'después'} (estado «${pierde.estado0}»)`, gana);
      }
    });
    vivos = vivos.filter(c => !fuera.has(c.id));
    // d) segunda llave: referencia + documento + fecha de firma
    const porClave = new Map(), unicos = [];
    vivos.forEach(c => {
      if (!c.ref || !c.firma) { unicos.push(c); return; }
      const k = [norm(c.ref).replace(/[\s.\-]/g, ''), c.doc, c.firma].join('|'), o = porClave.get(k);
      if (!o) { porClave.set(k, c); return; }
      const [gana, pierde] = c.act > o.act ? [c, o] : [o, c];
      porClave.set(k, gana); sale(pierde, 'Duplicado: misma referencia, contratista y fecha de firma', gana);
    });
    unicos.push(...porClave.values());
    // e) enriquecer
    const out = [];
    let antes = 0, sinFirma = 0;
    unicos.forEach(c => {
      if (!c.firma) { sinFirma++; sale(c, 'Sin fecha de firma'); return; }
      if (desde && c.firma < desde) { antes++; return; }
      c.estado = NOMBRE_ESTADO[norm(c.estado0)] || c.estado0;
      c.provKey = norm(c.prov) || '(sin nombre)';
      c.cat = categorizar(c);
      c.rubro = rubroDe(c.cat);
      c.nat = naturaleza(c);
      c.prog = proyecto(c);
      c.ano = +c.firma.slice(0, 4);
      c.mes = c.firma.slice(0, 7);
      const M = (mods[c.id] || []).map(([t, f, d]) => ({ t, f: S(f).slice(0, 10), d: ND(d) }));
      c.mods = M;
      c.nMod = M.filter(m => ES_MODIF(m.t)).length;
      c.base = N(base[c.proc]);
      c.valorIni = c.base > 0 ? Math.min(c.base, c.valor) : c.valor;
      c.adic = c.base > 0 ? Math.max(0, c.valor - c.base) : 0;   // estimado
      c.nAdic = M.filter(m => m.t === 'Adicion en el valor' || /adici/.test(norm(m.d))).length || (c.adic > 0 ? 1 : 0);
      c.novedad = c.adic > 0 ? 'Con adición en valor' : (c.diasAd > 0 ? 'Con prórroga (sin adición)' : (c.nMod > 0 ? 'Otra modificación' : 'Sin modificaciones'));
      c.conFin = FUENTES.some((_, i) => c['f' + i] > 0);
      out.push(c);
    });
    // nombre visible del contratista: la grafía más frecuente (SECOP mezcla mayúsculas)
    const graf = {};
    out.forEach(c => { const g = (graf[c.provKey] = graf[c.provKey] || {}); g[c.prov] = (g[c.prov] || 0) + 1; });
    out.forEach(c => { const g = graf[c.provKey]; c.provN = Object.keys(g).sort((a, b) => g[b] - g[a])[0] || '(sin nombre)'; });
    // contratos sucesivos de la misma persona con el mismo objeto
    const suc = {};
    out.forEach(c => { const k = c.provKey + '|' + norm(c.objeto); suc[k] = (suc[k] || 0) + 1; });
    out.forEach(c => { c.repite = suc[c.provKey + '|' + norm(c.objeto)]; });
    const calidad = {
      filas: crudos.length, contratos: out.length, antes, sinFirma,
      repId: excluidos.filter(e => e.motivo.startsWith('ID')).length,
      dup: excluidos.filter(e => e.motivo.startsWith('Duplicado')).length,
      estado: excluidos.filter(e => e.motivo.startsWith('Estado')).length,
    };
    return { contratos: out, excluidos, calidad };
  }

  G.NUCLEO = { norm, RUBROS, REGLAS, NATURALEZAS, PROYECTOS, MOD_NOMBRE, ES_MODIF, FUENTES, colorRubro, construir, categorizar, naturaleza };
})(typeof window !== 'undefined' ? window : globalThis);
