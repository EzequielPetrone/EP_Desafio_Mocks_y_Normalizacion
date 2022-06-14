import mongoose from "mongoose";

const mensajeSchema = new mongoose.Schema({

    author: {
        email: { type: String, required: true },
        nombre: { type: String },
        apellido: { type: String },
        edad: { type: Number, min: 0 },
        alias: { type: String, required: true },
        avatar: { type: String },
    },
    text: { type: String, required: true }
},
    { strict: false },
    { timestamps: true }
)

const mensajesModel = mongoose.model('mensajes', mensajeSchema)

export { mensajesModel } 