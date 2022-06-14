import 'dotenv/config' // Para poder usar las variables de entorno directamente.

//Importo mongoose
import mongoose from "mongoose";

// Function que me sirve para customizar la salida de los get
const formatDoc = (doc) => {
    if (doc) {
        const item = {
            id: doc._doc._id,
            ...doc._doc
        }
        delete item._id
        return item
    } else {
        return null
    }
}

class ContenedorMongo {

    constructor(model) {
        mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

        this.model = model;
    }

    async getAll() { //return Object[] - Devuelve un array con los objetos presentes en el archivo.
        try {
            const result = await this.model.find({}, { __v: 0 })
            return result.map(doc => formatDoc(doc))

        } catch (error) {
            console.log(`Error al querer leer el contenido de la colección ${this.model.modelName}.`, error)
            return null
        }
    }

    async save(obj) { //return Number - Recibe un objeto, lo guarda en el archivo, devuelve el id asignado.
        try {
            const item = { timeStamp: Date.now(), ...obj }
            const result = await new this.model(item).save();
            return result._id

        } catch (error) {
            console.log(`Pasaron cosas al guardar nuevo objeto en la colección ${this.model.modelName}.`, error);
            return null
        }
    }

    async getById(id) { //return Object - Recibe un id y devuelve el objeto con ese id, o null si no está.
        try {
            return formatDoc(await this.model.findById(id, { __v: 0 }))

        } catch (error) {
            console.log(`Error al obtener objeto con id ${id} de la colección ${this.model.modelName}.`, error);
            return null
        }
    }

    async deleteById(id) { //: void - Elimina del archivo el objeto con el id buscado.
        try {
            if (await this.model.findByIdAndDelete(id)) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(`Error al eliminar objeto con id ${id} de la colección ${this.model.modelName}.`, error);
            return null
        }
    }

    /*
    async deleteAll() { //: void - Elimina todos los objetos presentes en el archivo.
        try {
            const result = await this.model.deleteMany({})
            return result.deletedCount
            //Esto devuelve la qty de registros eliminados

        } catch (error) {
            console.log(`Error al eliminar la colección ${this.model.modelName}.`, error);
            return null
        }
    }
    */

    async editById(id, obj) {
        try {
            delete obj.id // Para que no duplique dentro del objeto el id (ya que Mongo lo maneja aparte)
            return await this.model.findByIdAndUpdate(id, obj) ? true : false

        } catch (error) {
            console.log(`Error al editar objeto con id ${id} de la colección ${this.model.modelName}.`, error);
            return null
        }
    }
}

export default ContenedorMongo