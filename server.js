import 'dotenv/config' // Para poder usar las variables de entorno directamente.
import path from 'path' // Para manejar las rutas del proyecto

//Importo Normalizr
import { normalize, schema } from 'normalizr'

//Seteo estructura para el normalizado
const schemaAuthor = new schema.Entity('authors', {}, { idAttribute: 'email' })
const schemaMensaje = new schema.Entity('mensajes', {
    author: schemaAuthor
})
const schemaChat = new schema.Entity('chats', {
    mensajes: [schemaMensaje]
})

//Importo Express y Socket.io y configuro el server http
import express from 'express'
const app = express();
import { createServer } from "http"
import { Server } from "socket.io"
const httpServer = createServer(app);
const io = new Server(httpServer);

//Importo Routes
import routerProductosTest from './src/routes/routerProductosTest.js';

//Importo contenedor de mensajes
import { MensajesDaoMongo } from './src/daos/mensajes/MensajesDaoMongo.js'

//Constante que seteo tanto del lado del server como del cliente ya que deben coincidir.
const CHATMSG = 'chat_msg'

async function serverMain() {
    try {
        //Seteo Routes
        app.use('/api/productos-test', routerProductosTest)

        //Configuro Middleware de manejo de errores
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: err });
        })

        //Lanzo index.html
        app.get("/", (req, res) => {
            try {
                res.sendFile(path.resolve('./public/index.html'));

            } catch (error) {
                res.status(500).json({ error: error });
            }
        })

        //Seteo Static
        const STATICPATH = '/static'
        app.use(STATICPATH, express.static(path.resolve('./public')));

        //Gestiono rutas no parametrizadas
        app.use('*', (req, res) => {
            res.status(404).json(
                { error: -2, descripcion: `ruta ${req.originalUrl} (método ${req.method}) no implementada` }
            )
        })

        //Seteo el contenedor de mensajes
        const contenedorChat = new MensajesDaoMongo()

        //Instancio array de mensajes de chat según lo que haya en cada BD
        const chat = { id: 'mensajes' }
        chat.mensajes = await contenedorChat.getAll()

        //Gestiono conexión de un cliente
        io.on('connection', (socket) => {

            console.log('Client connected:', socket.id);

            //Envío al nuevo socket los mensajes de chat registrados al momento
            socket.emit(CHATMSG, normalize(chat, schemaChat)) //envío normalizado

            //Recibo, guardo y retransmito Mensajes de Chat
            socket.on(CHATMSG, async (data) => {
                try {
                    let newId = await contenedorChat.save(data)
                    if (newId) {
                        const msj = await contenedorChat.getById(newId)
                        chat.mensajes.push(msj)
                        io.sockets.emit(CHATMSG, normalize(chat, schemaChat)); //envío normalizado

                    } else {
                        throw 'Error al guardar nuevo Mensaje de Chat'
                    }
                } catch (error) {
                    console.log(error);
                }
            });

            socket.on('disconnect', () => console.log('Disconnected!', socket.id));
        });

        //Socket.io Error logging
        io.engine.on("connection_error", (err) => {
            console.log(err.req);      // the request object
            console.log(err.code);     // the error code, for example 1
            console.log(err.message);  // the error message, for example "Session ID unknown"
            console.log(err.context);  // some additional error context
        });

        //Defino puerto y Pongo a escuchar al server
        try {
            const PUERTO = process.env.PORT || 8080;
            httpServer.listen(PUERTO, () => console.log(`Server running. PORT: ${httpServer.address().port}`));

        } catch (error) {
            //Si falla el listen al puerto estipulado pruebo que se me asigne automáticamente otro puerto libre...
            httpServer.listen(0, () => console.log(`Server running. PORT: ${httpServer.address().port}`));
        }

        //Server Error handling
        httpServer.on("error", error => {
            console.log('Error en el servidor:', error);
        })

    } catch (error) {
        console.log('Error en el hilo principal:', error);
    }
}
serverMain()