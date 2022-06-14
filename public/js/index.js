//Seteo estructura para el denormalizado
const { denormalize, schema } = normalizr
const schemaAuthor = new schema.Entity('authors', {}, { idAttribute: 'email' })
const schemaMensaje = new schema.Entity('mensajes', {
    author: schemaAuthor
})
const schemaChat = new schema.Entity('chats', {
    mensajes: [schemaMensaje]
})

//Constante que seteo tanto del lado del server como del cliente ya que deben coincidir.
const CHATMSG = 'chat_msg'

async function renderIndex() {

    //Registro Partials hbs
    Handlebars.registerPartial('header', await (await fetch('static/views/partials/header.hbs')).text());
    Handlebars.registerPartial('prodList', await (await fetch('static/views/partials/prodList.hbs')).text());
    Handlebars.registerPartial('tableRaw', await (await fetch('static/views/partials/tableRaw.hbs')).text());
    Handlebars.registerPartial('chat', await (await fetch('static/views/partials/chat.hbs')).text());
    Handlebars.registerPartial('chatMsg', await (await fetch('static/views/partials/chatMsg.hbs')).text());
    Handlebars.registerPartial('footer', await (await fetch('static/views/partials/footer.hbs')).text());

    //Compilo Main Template hbs
    const template = Handlebars.compile(await (await fetch('static/views/main.hbs')).text());

    //Me conecto
    const socket = io();

    socket.on('connect', async () => {
        //Cuando conecta inyecto template. 
        //Si el server se cae y vuelve a levantar se renderiza nuevamente (pero no es necesario un refresh)
        document.querySelector('span').innerHTML = template()

        //Referencio elementos html de la sección de chat
        const chatForm = document.querySelector('#chatForm')
        const inputEmail = document.querySelector('#chatEmail')
        const inputNombre = document.querySelector('#chatNombre')
        const inputApellido = document.querySelector('#chatApellido')
        const inputEdad = document.querySelector('#chatEdad')
        const inputAlias = document.querySelector('#chatAlias')
        const inputAvatar = document.querySelector('#chatAvatar')
        const inputMsj = document.querySelector('#chatMsj')
        const chatPC = document.querySelector('#porcentajeComp')
        const chatList = document.querySelector('#chatList')

        //Tratamiento del submit de un nuevo mensaje del chat al server:
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const mensaje = {
                author: {
                    email: inputEmail.value,
                    nombre: inputNombre.value,
                    apellido: inputApellido.value,
                    edad: inputEdad.value,
                    alias: inputAlias.value,
                    avatar: inputAvatar.value
                },
                text: inputMsj.value
            }

            socket.emit(CHATMSG, mensaje);
            inputMsj.value = null
        });

        //Recibo comunicación del socket informando nuevo msj de chat. Lo agrego al cuadro de chat.
        socket.on(CHATMSG, (data) => { //esta data viene normalizada desde el server

            //Denormalizo la data recibida para renderizarla
            const dData = denormalize(data.result, schemaChat, data.entities)
            //Calculo % compresión y lo renderizo
            const porcentaje = ((JSON.stringify(dData).length / JSON.stringify(data).length - 1) * 100).toFixed(1);
            chatPC.innerHTML = 'Compresión: ' + (porcentaje > 0 ? porcentaje : 0) + '%'

            const msgs = dData.mensajes.map(m => { //formateo el timeStamp
                m.timeStamp = (new Date(m.timeStamp)).toLocaleString()
                return m
            })

            chatList.innerHTML = Handlebars.compile('{{> chatMsg}}')({ msgs: msgs })

            chatList.parentElement.scroll(0, chatList.parentElement.scrollHeight) //El div que contiene el chat se va auto-scrolleando
        });

        //Fetch a la api de Productos y los agrego a la tabla.
        const response = await fetch('/api/productos-test');
        const productos = await response.json();

        const tbody = document.querySelector('#tablaProd tbody')
        //Compilo el html de un partial de hbs con la data de los productos
        tbody.innerHTML = Handlebars.compile('{{> tableRaw}}')({ productos: productos })
    })

    //En caso que el server se caiga...
    socket.on('disconnect', () => {
        //Lanzo alerta (que cuando se reconecta desaparece obviamente)
        document.querySelector('#serverAlert').style.display = null
    })
}
renderIndex()