---
id: "naming-287g-officials"
title: "Por qué publicamos los nombres de los funcionarios que firmaron acuerdos 287(g)"
date: "2026-07-10"
description: "El público merece saber quién firmó el acuerdo de su policía local con ICE, y cómo contactarlo."
type: "post"
byline: "Tory Lysik y David Eads"
tags:
  - "field-notes"
lang: "es"
previewImage: "/images/287g-og-moa.png"
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

Desde el principio, concebimos [287(g) Watch](https://287g.recoveredfactory.net) como una herramienta explicativa y de rendición de cuentas. Hemos agregado dos funciones que nos acercan a esa visión:

* [Páginas estatales con resúmenes de noticias escritos por IA y fundamentados en datos](https://287g.recoveredfactory.net/es/states). Pronto escribiremos sobre ellas.
* Los nombres y la información de contacto de los funcionarios de las agencias que firmaron acuerdos 287(g) con el Departamento de Seguridad Nacional (DHS), como en el caso de la [Oficina del Sheriff del Condado de Autauga, Alabama](https://287g.recoveredfactory.net/es/agency/autauga-county-sheriffs-office-al).

<div class="grid grid-cols-2 gap-4 sm:gap-6 my-6 mx-auto max-w-lg">
  <ResizedImage
    src="/images/287g-state-summaries.png"
    alt="Una página estatal de 287(g) Watch para Misuri, con el número de agencias, un resumen de noticias escrito por IA y un mapa de las agencias participantes"
    figureClass="my-0 max-w-full"
    class="rounded-lg shadow-xl"
  />
  <ResizedImage
    src="/images/287g-signers.png"
    alt="El detalle de una agencia en 287(g) Watch que muestra quién firmó cada acuerdo por parte de ICE y la información de contacto público de cada acuerdo"
    figureClass="my-0 max-w-full"
    class="rounded-lg shadow-xl"
  />
</div>

¿Por qué estamos extrayendo y revelando los contactos de las agencias a partir de estos acuerdos? Un acuerdo 287(g) no es solo una postura de política pública ni una casilla burocrática que marcar: es una decisión, tomada por un funcionario con nombre y apellido, de incorporar a su agencia a una asociación con el Servicio de Inmigración y Control de Aduanas (ICE), una asociación que otorga a los agentes locales la autoridad para hacer cumplir la ley federal de inmigración.

Esa decisión tiene consecuencias para personas reales que viven en esa jurisdicción. Las agencias incluyen su información de contacto completa en los acuerdos, que ICE publica junto con su lista de participantes.

Ya seas partidario o crítico del programa 287(g), por razones ideológicas o pragmáticas, mereces saber quién tomó esa decisión y cómo contactarlo en su calidad oficial. Ahora, al menos donde el acuerdo está disponible, puedes hacerlo.

## Cómo lo hicimos

El archivo [Tracking 287(g)](https://github.com/appelson/Tracking_287g) de Elijah Appelson, nuestra fuente principal de datos, contiene más de 1.800 archivos de Memorándum de Acuerdo que se remontan a 2016. Se trata de los documentos firmados originales. Siguen un formato bastante estandarizado y no revelan mucho, pero sí incluyen nombres, cargos, asignaciones de oficina de campo y fechas. Habíamos estado enlazando a ellos, pero no habíamos construido el código para procesarlos.

Esto es lo que pasa con esos PDF: están formateados para ojos humanos. Cada uno tiene un diseño de dos columnas —el bloque de firmas de la agencia local a un lado y el de ICE al otro— para que una persona que lo lea pueda ver a ambas partes de un vistazo. El software no lee así. Lee de izquierda a derecha a lo ancho de toda la página, lo que revuelve las dos columnas: el cargo del funcionario de ICE intercalado con el nombre del sheriff, o el nombre de una ciudad donde debería ir un cargo. La información era técnicamente pública. Solo que no era legible por máquina sin pelear.

<ResizedImage
  src="/images/287g-2col-moa.png"
  alt="El bloque de firmas de dos columnas de un acuerdo 287(g) firmado: el bloque de firma del sheriff local a la izquierda y el de ICE a la derecha"
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

La solución fue convertir los PDF a texto con el modo de preservación de diseño de pdftotext, que mantiene la posición espacial de cada línea, y luego contar los espacios iniciales para determinar a qué columna pertenece cada línea: treinta o más espacios iniciales significan que forma parte de la segunda columna.

A partir de ahí, tuvimos que lidiar con tres formatos de acuerdo distintos, construir una lista de bloqueo de falsos positivos (basura de plantilla como «For ICE:» seguía colándose como nombre de firmante) y ajustar los parsers a las particularidades de cada plantilla. La herramienta ahora extrae el nombre y el cargo del funcionario de ICE que firmó —normalmente un funcionario de la sede central, como el subdirector o el director interino de ICE— junto con la oficina de campo de ICE responsable del acuerdo, el nombre del jefe de la agencia local cuando aparece como texto mecanografiado y el punto de contacto público de cada agencia. El [código de extracción está disponible en GitHub](https://github.com/recoveredfactory/287g-watch/blob/main/packages/pipeline/extract-moa-signers.ts).

La cobertura no está completa. Algunos PDF más antiguos no se procesan limpiamente, las fechas de las adendas están incrustadas como metadatos de la firma digital en lugar de como texto legible y, en la plantilla actual, la firma del funcionario local muchas veces existe solo como la imagen de un nombre manuscrito o de una firma, sin texto mecanografiado que extraer.

Pero para la mayoría de las agencias con un PDF archivado, ahora puedes consultar a quién contactar y, en cientos de casos, exactamente quién firmó. No hemos terminado: el siguiente paso es extraer de los PDF las firmas mismas como imágenes, para que incluso donde no existe un nombre mecanografiado, el registro de quién firmó quede preservado y visible.

Los funcionarios públicos que toman decisiones públicas deben ser identificados por su nombre. Deberías poder contactarlos en su calidad oficial y decirles lo que piensas. Esta información siempre estuvo en los documentos que ICE publica. Ahora es tuya.
