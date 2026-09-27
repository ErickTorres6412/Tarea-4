# Tarea 4 — Actualizaciones diferidas con RabbitMQ

**Curso:** EIF508 — Sistemas Distribuidos
**Estudiante:** Erick Torres Hernandez
**Backend publicado (Netlify):** <https://bookstore-rabbitmq-erick.netlify.app>
**Frontend publicado:** _(completar, p. ej. `https://usuario.github.io/tarea4-bookstore/`)_

Basada en el [Tutorial 9 — RabbitMQ](https://distribuidos-una.netlify.app/#/practicas/Tutorial9_RabbitMQ)
y en su [código](https://github.com/armando-arce/Tutoriales-Distribuidos/tree/main/Tutorial9).

---

## Descripción

La aplicación *Bookstore* administra **libros, autores y editoriales** en forma
**diferida**: las operaciones de agregar, modificar y eliminar no tocan la base de
datos, sino que envían un mensaje a una cola de RabbitMQ (CloudAMQP). Una función
"asignadora de tareas" (`bookTasks`, `authorTasks`, `publisherTasks`) lee los
mensajes pendientes e invoca a las funciones *batch*, que son las que realmente
modifican la base de datos SQL (PostgreSQL de **Netlify Database**, que funciona sobre Neon).

```
 Frontend (Vue)            Netlify Functions                 CloudAMQP        Neon
 ─────────────             ─────────────────                 ─────────        ────
 Create / Edit / Erase ──► xxxInsert / xxxUpdate / xxxDelete ──► cola  ──┐
                                                                         │
 "Process queue" o  ─────► xxxTasks ◄── channel.get() ───────────────────┘
 invocación manual           │
                             └──► xxxInsertBatch / xxxUpdateBatch / xxxDeleteBatch ──► tabla
 Listas / detalle ───────► xxxFindAll / xxxFind ◄─────────────────────────────────────── tabla
```

| Entidad | Cola RabbitMQ | Tabla (Neon) | Asignador |
|---|---|---|---|
| Libros | `bookstore` | `books` | `bookTasks` |
| Autores | `authors` | `authors` | `authorTasks` |
| Editoriales | `publishers` | `publishers` | `publisherTasks` |

Cada entidad usa **su propia cola**. Si las tres compartieran `bookstore`,
`bookTasks` consumiría (y descartaría, porque usa `noAck`) los mensajes de
autores y editoriales, y viceversa.

### Funciones del backend (por entidad `book`, `author`, `publisher`)

| Función | Método | Qué hace |
|---|---|---|
| `xxxFindAll` | GET | Lista todos los documentos |
| `xxxFind/:id` | GET | Devuelve un documento (arreglo de un elemento) |
| `xxxInsert` | POST | Encola `{"method":"INSERT","body":{...}}` |
| `xxxUpdate/:id` | PUT | Encola `{"method":"UPDATE","id":N,"body":{...}}` |
| `xxxDelete/:id` | DELETE | Encola `{"method":"DELETE","id":N}` |
| `xxxTasks` | GET | Vacía la cola e invoca las funciones *batch*; responde `{"processed":N}` |
| `xxxInsertBatch` | POST | `INSERT` en Neon |
| `xxxUpdateBatch/:id` | PUT | `UPDATE` en Neon (los campos ausentes conservan su valor) |
| `xxxDeleteBatch/:id` | DELETE | `DELETE` en Neon |

Módulos compartidos: `rabbitMQ.js` (conexión a CloudAMQP), `neonDB.js`
(conexión a Neon con `@neondatabase/serverless`) y `headersCORS.js`.

### Cambios respecto al código del repositorio del tutorial

* Los mensajes se construyen con `JSON.stringify(...)` (ver la pregunta del ejercicio 5).
* `bookDelete` devolvía una variable inexistente (`status`); ahora responde `OK`.
* `rabbitMQ.js` reutiliza la conexión mientras la función siga activa y cada
  función cierra su canal; así no se agota el límite de conexiones del plan
  gratuito *Little Lemur*.
* Se usa un canal con confirmaciones (`waitForConfirms`) para garantizar que el
  broker recibió el mensaje antes de responder `OK`.
* `*Tasks` toma la dirección del sitio de la variable `URL` que define Netlify, en
  lugar de tenerla fija en el código.
* Las funciones de consulta y *batch* usan una base de datos SQL (Neon), como indica
  el texto del tutorial, en lugar de MongoDB; los identificadores pasan de `_id` a `id`.
* El frontend usa historial por *hash* y `base: './'` para funcionar en
  cualquier hosting estático (GitHub Pages, Vercel, etc.).

---

## Estructura

```
Tarea 4/
├── README.md
├── backend/                     Netlify Functions (se publica en Netlify)
│   ├── netlify.toml
│   ├── package.json             amqplib + @neondatabase/serverless
│   ├── schema.sql               tablas y datos iniciales (para otra base Neon)
│   ├── seed.js                  ejecuta schema.sql en la base de DATABASE_URL
│   ├── netlify/database/migrations/0001_create-bookstore-tables/
│   │                            migración que Netlify aplica al publicar
│   ├── .env.example
│   └── netlify/functions/       27 funciones + rabbitMQ.js, neonDB.js, headersCORS.js
└── frontend/                    Vue 3 + vue-router + Vite (sitio estático)
    ├── .env.example             VITE_API_URL
    └── src/components/          Home, Book*, Author*, Publisher* (Index y Details)
```

---

## Ejercicio 1 — CloudAMQP

1. Crear una cuenta en <https://www.cloudamqp.com> y una instancia con el plan
   gratuito **Little Lemur**.
2. Copiar el **AMQP URL** de la instancia.
3. Entrar a **RabbitMQ Manager → Queues and Streams → Add a new queue** y crear la
   cola `bookstore` (tipo *Classic*, *Durable*). Crear también `authors` y
   `publishers`. Si no existen, las funciones las crean solas con `assertQueue`.
4. Enviar peticiones a `bookInsert`, `bookUpdate` y `bookDelete` (desde el
   frontend o con `curl`, ver abajo) y verificar en la pestaña **Queues** que la
   columna *Ready* de `bookstore` aumenta. Con **Get messages** se puede ver el
   contenido JSON de cada mensaje sin procesarlo (usar *Ack mode: Nack message
   requeue true* para no perderlo).

## Base de datos — Netlify Database (Neon)

La base de datos la aprovisiona **Netlify Database** (PostgreSQL sobre Neon) al
publicar, porque el backend incluye el paquete `@netlify/database`. Al publicar,
Netlify aplica la migración
`netlify/database/migrations/0001_create-bookstore-tables/migration.sql`, que crea
las tablas `books`, `authors` y `publishers` con los datos iniciales.

Las funciones siguen el estilo del tutorial (`exports.handler`, *Lambda
compatibility mode*), y en ese modo Netlify **no** inyecta la conexión
automáticamente. Por eso hay que copiarla a mano:

1. En Netlify: **Data & Storage → Database**, rama `production` →
   *Copy connection string*.
2. `npx netlify env:set DATABASE_URL "postgresql://..."` y volver a publicar.

`neonDB.js` usa `DATABASE_URL`, así que también sirve cualquier otra base de Neon.
En ese caso se crean las tablas pegando `backend/schema.sql` en el *SQL Editor* de
Neon o con `npm run seed`. Ojo: `schema.sql` borra y recrea las tablas.

## Ejercicio 4 — Publicación

### Backend en Netlify (sólo las funciones)

```powershell
cd backend
npx netlify login
npx netlify init            # o "netlify link" si el sitio ya existe
npx netlify deploy --prod      # primera publicacion: aprovisiona la base
npx netlify env:set DATABASE_URL "postgresql://..."   # copiada del panel
npx netlify env:set CLOUDAMQP_URL "amqps://..."
npx netlify deploy --prod
```

Verificar: `https://<sitio>.netlify.app/.netlify/functions/bookFindAll`

### Frontend en un hosting estático

Crear `frontend/.env` con la URL del backend (sin barra al final):

```
VITE_API_URL=https://<sitio>.netlify.app
```

**GitHub Pages:**

```powershell
cd frontend
npm install
npm run build
npx gh-pages -d dist        # publica dist/ en la rama gh-pages del repositorio
```

y en GitHub activar *Settings → Pages → Branch: gh-pages*.

**Vercel (alternativa):** `npx vercel --prod` dentro de `frontend/`, con la
variable `VITE_API_URL` definida en *Settings → Environment Variables*
(*framework preset*: Vite, *output*: `dist`).

---

## Ejercicio 5 — Prueba manual del flujo completo

1. En el frontend ir a **Books → Edit** de un libro, cambiar el título y pulsar
   **Update**. Aparece el aviso de que la solicitud fue encolada; la lista todavía
   muestra el título anterior.
2. En el **Rabbit Manager → Queues**, la cola `bookstore` muestra 1 mensaje *Ready*.
   Con *Get messages* se ve `{"method":"UPDATE","id":1,"body":{...}}`.
3. Invocar manualmente la función, abriendo en el navegador (o con `curl`):
   `https://<sitio>.netlify.app/.netlify/functions/bookTasks`
   (o el botón **Process queue (bookTasks)** del frontend). Responde
   `{"processed":1}` y la cola vuelve a 0 mensajes.
4. Pulsar **Refresh** en la lista de libros (o consultar `bookFindAll`, o ver la
   tabla `books` en **Data & Storage → Database** de Netlify): el nuevo título ya
   aparece en la base de datos.

El mismo flujo aplica a autores (`authorTasks`) y editoriales (`publisherTasks`).

Con `curl`:

```bash
API=https://<sitio>.netlify.app/.netlify/functions
curl -X PUT $API/bookUpdate/1 -H "Content-Type: application/json" \
     -d '{"id":1,"title":"Operating System Concepts (10th)"}'
# ... revisar la cola en el Rabbit Manager ...
curl $API/bookTasks        # {"processed":1}
curl $API/bookFind/1       # el título ya cambió
```

### ¿Por qué el mensaje debe ser un JSON válido (con comillas dobles)?

RabbitMQ no sabe nada del contenido de un mensaje: lo guarda y lo entrega como
una secuencia de bytes. El productor (`bookUpdate`) convierte el objeto en texto
y el consumidor (`bookTasks`) tiene que volver a convertir ese texto en un objeto
con `JSON.parse(message.content.toString())` para poder leer `request.method`,
`request.id` y `request.body`.

`JSON.parse` no interpreta JavaScript, sino el formato JSON, que es estricto: los
nombres de las propiedades y los textos **deben** ir entre comillas dobles. Un
texto como `{'method':'UPDATE','id':1}` es un literal válido en JavaScript, pero
no es JSON. `JSON.parse` lanza `SyntaxError: Expected property name or '}'`, la
función cae en el `catch` y el cambio nunca llega a la base de datos. Además, como
`bookTasks` usa `noAck: true`, el mensaje ya se sacó de la cola y se pierde.

Por eso el código del repositorio del tutorial, que armaba el mensaje con una
plantilla de texto y comillas simples (`` `{'method':'UPDATE','id':${id},'body':${event.body}}` ``),
no funcionaba. Armar el JSON a mano también es frágil: un valor con comillas o
caracteres especiales (por ejemplo, la editorial *O'Reilly* o un título con `"`)
rompería el formato. `JSON.stringify({method: 'UPDATE', id, body})` resuelve
ambos problemas, porque siempre produce JSON válido: usa comillas dobles y escapa
automáticamente los caracteres especiales. Lo que produce `JSON.stringify` lo
puede reconstruir `JSON.parse` sin ambigüedad del otro lado de la cola.

---

## Ejecución local

Requiere un RabbitMQ y una base de datos Neon (puede ser la misma de la nube):

```powershell
docker run -d --name rabbit -p 5672:5672 -p 15672:15672 rabbitmq:4-management
```

`backend/.env`:

```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
CLOUDAMQP_URL=amqp://guest:guest@localhost:5672
```

```powershell
cd backend;  npm install; npm run seed; npm run dev      # http://localhost:8888
cd frontend; npm install; npm run dev                   # http://localhost:5173
```

El Rabbit Manager local queda en <http://localhost:15672> (guest / guest).
