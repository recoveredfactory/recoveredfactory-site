Este documento acompaña al artículo editorial. Enumera cada cantidad que aparece en (o respalda) el artículo y, para cada una, ofrece una nota breve y en lenguaje llano sobre exactamente cómo se calculó. Está pensado para leerse por sí solo: debería poder entenderse sin conocimiento previo de las herramientas o los datos que hay detrás del artículo.

**De dónde vienen los datos.** La mayoría de las cifras provienen del [Deportation Data Project](https://deportationdata.org) (DDP), una iniciativa de interés público alojada en la Facultad de Derecho de UC Berkeley que obtiene conjuntos de datos internos del gobierno de EE. UU. sobre control migratorio mediante la Ley de Libertad de Información (FOIA) y los publica —en su mayoría como registros anonimizados a nivel individual— bajo una dedicatoria de dominio público CC-0, cada uno acompañado de la propia documentación y el [libro de códigos](https://deportationdata.org/data) del DDP. Este artículo usa el conjunto de datos publicado por el DDP que une los registros de arrestos internos de ICE con los registros de estancias de detención de ICE. Los nombres de campos y valores codificados que se citan abajo (p. ej. `apprehension_date`, `final_order_yes_no`, los códigos de criminalidad `1`/`2`/`3`) son los propios del DDP — consulte el libro de códigos del DDP para sus definiciones autorizadas.

Dos familias de cifras provienen de **fuera** del DDP. Los recuentos de 287(g) (véase "Control local") provienen de un rastreo diario de la propia lista pública de ICE de agencias estatales y locales participantes, no del DDP. Y los recuentos de retórica (véase "Corpus de retórica") provienen del archivo público de comunicados de prensa del DHS. Cada una de esas secciones lo indica de nuevo donde aparecen sus números.

**Cómo se producen estos números.** Los datos en bruto se procesan una sola vez a través de una única rutina de análisis que calcula cada cifra y las escribe en un solo archivo legible por máquina; este documento se produce luego únicamente leyendo y dando formato a ese archivo. No ejecuta ninguna consulta de base de datos ni invoca ningún modelo de IA o estadístico — es una transformación simple y determinista, de modo que las mismas entradas siempre dan exactamente estos números. (Verificado: regenerar este documento repetidamente a partir de las mismas entradas produce un resultado idéntico byte por byte.)

**Conjunto de datos base.** El análisis opera sobre el conjunto de datos del DDP que une arrestos x estancias de detención — una fila por arresto interior de ICE deduplicado, con una estancia de detención adjunta cuando el ingreso (book-in) cae entre 5 días antes y 10 días después del arresto.

**División por administración** (`apprehension_date` frente al límite de la toma de posesión de Trump): `BIDEN = apprehension_date < TIMESTAMP '2025-01-20'`, `TRUMP = apprehension_date >= TIMESTAMP '2025-01-20'`. Las dos administraciones se leen por separado, nunca como una sola curva continua.

## Titular (todos los arrestos, ambas administraciones)

_Cada fila es un arresto de ICE deduplicado; "detención" significa una estancia de detención registrada entre cinco días antes y diez días después del arresto._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Total de arrestos | 705,286 | `COUNT(1)` sobre toda la tabla unida |
| Total detenidos | 544,300 | `SUM(CASE WHEN has_detention_stay THEN 1 ELSE 0 END)` |
| Tasa de detención general | 77.2% | detenidos / arrestos × 100 |
| Ventana de cobertura | 2022-10 → 2026-02 | serie mensual tras recortar los meses finales rezagados/incompletos (un mes final se descarta mientras sus arrestos &lt; 0,6 × la mediana de los 6 previos) |
| Mediana del retraso de ingreso | 0.42 horas | `APPROX_PERCENTILE_CONT(0.5)` de `(stay_book_in_date_time − apprehension_date_time)/3600` sobre arrestos detenidos con ambas marcas de tiempo |

## Tasa de detención por administración

_Son dos administraciones de control migratorio distintas, así que la serie completa no debe leerse como una única tendencia continua._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Biden arrestos / detenidos / tasa | 315,461 / 193,474 / 61.3% | mismas fórmulas del titular, filtradas a la ventana `BIDEN` |
| Trump arrestos / detenidos / tasa | 389,825 / 350,826 / 90.0% | mismas fórmulas del titular, filtradas a la ventana `TRUMP` |

## Consecuencias de la detención por arresto

_Esta es la capacidad que la unión de julio de arrestos x estancias de detención desbloquea por primera vez; cada porcentaje se toma sobre los arrestos salvo que esté marcado como 'de detenidos'._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Trump: liberación rápida (sin ingreso) | 38,999 (10.0% de arrestos) | `SUM(NOT has_detention_stay)`; pct / arrestos |
| Trump: aún bajo custodia | 49,810 (14.2% de detenidos) | `SUM(has_detention_stay AND stay_book_out_date_time IS NULL)`; pct / detenidos |
| Trump: fianza pagada | 28,465 (8.1% de detenidos) | `SUM(bond_posted_amount_lowest_seen > 0)`; pct / detenidos |
| Trump: mediana de estancia completada | 21.9 días | `APPROX_PERCENTILE_CONT(0.5)` de `(book_out − book_in)/86400` sobre estancias **cerradas** (book_out no nulo) |
| Trump: mediana de tramos por persona detenida | 3 | `APPROX_PERCENTILE_CONT(0.5)` de `n_stints` sobre personas detenidas. NB: `n_stints` = segmentos de ingreso por instalación (los traslados crean varios tramos dentro de una misma estancia); NO son estancias de detención **distintas** (`n_stays`, cuya mediana es 1 en ambas eras) |
| Biden: liberación rápida (sin ingreso) | 121,987 (38.7% de arrestos) | `SUM(NOT has_detention_stay)`; pct / arrestos |
| Biden: aún bajo custodia | 714 (0.4% de detenidos) | `SUM(has_detention_stay AND stay_book_out_date_time IS NULL)`; pct / detenidos |
| Biden: fianza pagada | 21,010 (10.9% de detenidos) | `SUM(bond_posted_amount_lowest_seen > 0)`; pct / detenidos |
| Biden: mediana de estancia completada | 22.8 días | `APPROX_PERCENTILE_CONT(0.5)` de `(book_out − book_in)/86400` sobre estancias **cerradas** (book_out no nulo) |
| Biden: mediana de tramos por persona detenida | 2 | `APPROX_PERCENTILE_CONT(0.5)` de `n_stints` sobre personas detenidas. NB: `n_stints` = segmentos de ingreso por instalación (los traslados crean varios tramos dentro de una misma estancia); NO son estancias de detención **distintas** (`n_stays`, cuya mediana es 1 en ambas eras) |

## Combinación de desenlaces (3 vías, proporción de todos los arrestos)

_"Liberado tras detención" equivale a detenidos menos quienes siguen bajo custodia, y cada porcentaje se toma sobre todos los arrestos._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Trump: liberación rápida | 38,999 (10.0%) | `SUM(NOT has_detention_stay)` / arrestos |
| Trump: liberado tras detención | 301,016 (77.2%) | (detenidos − aún bajo custodia) / arrestos |
| Trump: aún bajo custodia | 49,810 (12.8%) | `SUM(has_detention_stay AND book_out IS NULL)` / arrestos |
| Biden: liberación rápida | 121,987 (38.7%) | `SUM(NOT has_detention_stay)` / arrestos |
| Biden: liberado tras detención | 192,760 (61.1%) | (detenidos − aún bajo custodia) / arrestos |
| Biden: aún bajo custodia | 714 (0.2%) | `SUM(has_detention_stay AND book_out IS NULL)` / arrestos |

## Taxonomía de desenlaces (5 vías, proporción de todos los arrestos)

_Cada persona se ubica en una sola categoría según su motivo de liberación y los campos de salida del lado del arresto._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Trump: liberado sin detención | 38,999 (10.0%) | `NOT has_detention_stay` |
| Trump: expulsado / salió del país | 261,302 (67.0%) | motivo de liberación EN ('Removed','Voluntary departure','Voluntary Return') |
| Trump: liberado dentro de EE. UU. | 26,913 (6.9%) | motivo de liberación EN el conjunto de fianza / orden de supervisión / libertad condicional (parole) / alivio |
| Trump: trasladado / otro | 12,793 (3.3%) | cualquier otro motivo de liberación no nulo (traslado/entrega/otro) |
| Trump: aún bajo custodia | 49,818 (12.8%) | motivo de liberación IS NULL (ingresado, aún no liberado) |
| Biden: liberado sin detención | 121,987 (38.7%) | `NOT has_detention_stay` |
| Biden: expulsado / salió del país | 130,147 (41.3%) | motivo de liberación EN ('Removed','Voluntary departure','Voluntary Return') |
| Biden: liberado dentro de EE. UU. | 51,725 (16.4%) | motivo de liberación EN el conjunto de fianza / orden de supervisión / libertad condicional (parole) / alivio |
| Biden: trasladado / otro | 10,353 (3.3%) | cualquier otro motivo de liberación no nulo (traslado/entrega/otro) |
| Biden: aún bajo custodia | 1,249 (0.4%) | motivo de liberación IS NULL (ingresado, aún no liberado) |

## Señal de expulsión (era Trump)

_Estas señales corroboran con qué frecuencia un arresto de la era Trump terminó en una expulsión o salida real._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Expulsado / salió del país | 261,302 (67.0% de arrestos) | motivo de liberación EN el conjunto expulsado/salió; pct / arrestos |
| Tiene fecha de salida | 278,637 | `COUNT` donde el `departed_date` del lado del arresto está definido |
| Tiene orden final (YES) | 219,945 | `COUNT` donde `final_order_yes_no = 'YES'` (el valor está en mayúsculas) |
| Motivo de expulsión corroborado por fecha de salida | 97.0% | proporción de estancias 'Removed' que además llevan un `departed_date` — las dos señales independientes se corroboran |
| Principales países de salida | Mexico 128,741, Guatemala 42,305, Honduras 32,496, Venezuela 13,756, El Salvador 11,936, Ecuador 8,200, Nicaragua 8,017, Colombia 7,494 | `GROUP BY` país de salida sobre arrestos expulsados/salidos, top 8 (los valores de país se almacenan en mayúsculas) |

## Criminalidad (clasificación de 3 vías de ICE, era Trump)

_Las etiquetas llevan un dígito inicial: '1 Convicted Criminal', '2 Pending Criminal Charges', '3 Other Immigration Violator'. Son clasificaciones administrativas de ICE, no resoluciones judiciales._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Criminal condenado | 128,000 arrestos, 94.2% detenidos | `WHERE apprehension_criminality = '1 Convicted Criminal'` — tiene una condena |
| Cargos pendientes | 113,043 arrestos, 94.6% detenidos | '2 Pending Criminal Charges' — acusado pero NO condenado |
| Otro infractor migratorio | 148,782 arrestos, 82.9% detenidos | '3 Other Immigration Violator' — ni acusado ni condenado (civil) |
| No condenado por nada | 261,825 (67.2% de los arrestos de Trump) | cargos pendientes + otro infractor migratorio (sin condena). Decir 'no condenado por nada', nunca 'no acusado de nada' |
| No acusado de nada | 148,782 (38.2% de los arrestos de Trump) | otro infractor migratorio SOLAMENTE (sin ningún cargo) |
| Tasa de detención no criminal: Biden → Trump | 22.9% → 82.9% | tasa de detención de '3 Other Immigration Violator', en cada ventana de administración |

## Control local — 287(g)

_Estas cifras de 287(g) no provienen del DDP; provienen de un rastreo diario de la propia lista pública de ICE de agencias estatales y locales que han firmado acuerdos 287(g), recopiladas a través de todas las instantáneas diarias y contadas como agencias distintas que participan actualmente._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Agencias participantes a nivel nacional | 1,720 | `COUNT(DISTINCT COALESCE(ori, normalized_agency_name))` en `tracking_287g_agreements` WHERE `is_current = true` |
| Principales estados | Texas 350, Florida 272, Pennsylvania 104, Arkansas 98, Missouri 97, Tennessee 80 | mismo recuento de agencias distintas, agrupado por estado |
| Estados santuario con cero agencias | California, Connecticut, Washington, Vermont, Oregon, Illinois, New Jersey | estados de la lista de vigilancia santuario cuyo recuento de agencias distintas es 0 |

## Corpus de retórica (comunicados de prensa del DHS)

_Estos recuentos provienen del propio archivo público de comunicados de prensa del Departamento de Seguridad Nacional (DHS), que cubre comunicados emitidos desde el 20 de enero de 2025 hasta el 13 de julio de 2026 (rango del corpus 2025-01-20..2026-07-13)._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Comunicados del DHS, era Trump | 971 | `COUNT(1)` de comunicados del DHS con `release_date >= 2025-01-20` |
| Comunicados 'Worst of the worst' | 42 | título `LIKE 'WORST OF THE WORST%'` |
| Comunicados titulados sobre santuario | 88 | título que coincide con el patrón de santuario |
| Comunicados titulados sobre detainers | 68 | título que coincide con el patrón de detainer |
| Comunicados de ataque a gobernadores nombrados | Pritzker 11, Walz 7, Spanberger 10, Newsom 9, Hochul 1 | recuento de comunicados cuyo título nombra a cada gobernador |

## Series (desgloses disponibles en su totalidad en los datos subyacentes)

_Estos son desgloses más largos cuyas matrices completas viven en los datos subyacentes; aquí solo se resume su forma._

| Cifra | Valor | Cómo se calcula |
|---|---|---|
| Arrestos / tasa de detención mensuales | 41 meses, 2022-10 → 2026-02 | `GROUP BY DATE_TRUNC('month', apprehension_date)`; tasa = detenidos/arrestos |
| Combinación de criminalidad mensual | 14 meses, proporciones dentro del mes | `GROUP BY apprehension_criminality` mensual, proporción del total de ese mes |
| Histograma de duración de estancia | 8 tramos × 2 administraciones | `(book_out − book_in)/86400` agrupado en tramos sobre estancias detenidas cerradas |
| Por programa | 10 filas | arrestos y tasa de detención agrupados por esa dimensión, top-N por arrestos |
| Por ciudadanía | 12 filas | arrestos y tasa de detención agrupados por esa dimensión, top-N por arrestos |
| Por estado | 15 filas | arrestos y tasa de detención agrupados por esa dimensión, top-N por arrestos |
| Por área de responsabilidad (AOR) | 15 filas | arrestos y tasa de detención agrupados por esa dimensión, top-N por arrestos |

---

_Nota: este documento se toma de una sola fuente — las mismas cifras calculadas que respaldan el gráfico y el artículo, recomputadas a partir de la publicación bruta del DDP. La prosa publicada se edita a mano, por lo que algunos redondeos narrativos pueden diferir de estas cifras exactas — esa diferencia es una libertad editorial intencional, y estas cifras son la verdad numérica de referencia._
