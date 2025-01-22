const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

let db = mongoose.createConnection("mongodb://localhost:27017/docker_manager");

const userSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    grupo: String,
    rol: String,
    last_login: Date
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email', usernameLowerCase: true});

const containerSchema = new mongoose.Schema({
    container_id: String,
    container_name: String,
    container_image: String,
    container_status: String,
    container_portsBiding: String,
    container_hostPorts: [Number],
    container_created: Date,
    container_started: Date,
    container_stopped: Date,
    container_logs: String,
    owner: String,
    grupo: String
});

const User = db.model('User', userSchema);
const Container = db.model('Container', containerSchema);

module.exports = {
    db: db,
    User: User,
    Container: Container
}
