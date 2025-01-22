/// docker.js - Controlador de Docker

let Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'})
let Container = require('../db/mongoose-handler').Container;

async function getEngineVersion() {
    let docker_version_json = await docker.version();
    let docker_version = {
        plataform: docker_version_json.Platform.Name,
        version: docker_version_json.Version,
        Os: docker_version_json.Os
    }
    return docker_version;
}

async function getContainers(getAll = true) {
    let containers = await docker.listContainers({all: getAll});
    return containers;
}

async function getImages() {
    let images = await docker.listImages();
    return images;
}

async function createContainer(containerConfig, userData) {
    let images = await getImages();
    if (!images.find(image => image.RepoTags.includes(containerConfig.Image))) {
        console.log("Image not found, pulling...");
        console.log(containerConfig.Image);
        let image = await docker.pull(containerConfig.Image);
    }
    let container = await docker.createContainer(containerConfig);

    return container;
}

async function startContainer(containerId) {
    let container = docker.getContainer(containerId);
    await container.start();
    return container;
}

async function stopContainer(containerId) {
    let container = docker.getContainer(containerId);
    await container.stop();
    return container;
}

async function restartContainer(containerId) {
    let container = docker.getContainer(containerId);
    await container.restart();
    return container;
}

async function removeContainer(containerId) {
    let container = docker.getContainer(containerId);
    await container.remove();
    return container;
}


module.exports = {
    getEngineVersion,
    getContainers,
    createContainer,
    startContainer,
    stopContainer,
    restartContainer,
    removeContainer,
    getImages
}