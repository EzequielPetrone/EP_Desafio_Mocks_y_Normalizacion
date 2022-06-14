//Importo Clase Contenedor para luego extender de ella
import ContenedorMongo from '../../contenedores/ContenedorMongo.js';

// Importo Model del schema 'productos' 
import { mensajesModel } from '../../models/mensajes.js'

//DAO que extiende de clase Contenedor
class MensajesDaoMongo extends ContenedorMongo {

    constructor() {
        super(mensajesModel);
    }
}

export { MensajesDaoMongo }