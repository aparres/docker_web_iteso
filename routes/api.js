var express = require('express');
var router = express.Router();

/*var Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'})*/

let dockerController = require('../controller/docker');

/* GET home page. */
router.get('/engineVersion', async function(req, res, next) {
   let docker_version_json = await dockerController.getEngineVersion();
   res.status(200).send(docker_version_json);
});

router.get('/containers', async function(req, res, next) {
   let containers = await dockerController.getContainers(true);
   res.status(200).send(containers);
});

router.post('/containers', async function(req, res, next) {
   let containerConfig = req.body;
   let container = await dockerController.createContainer(containerConfig);
   res.status(201).send(container);
});

router.post('/containers/:id/start', async function(req, res, next) {
   let containerId = req.params.id;
   let container = await dockerController.startContainer(containerId);
   res.status(200).send(container);
});

router.post('/containers/:id/stop', async function(req, res, next) {
   let containerId = req.params.id;
   let container = await dockerController.stopContainer(containerId);
   res.status(200).send(container);
});

router.post('/containers/:id/restart', async function(req, res, next) {
   let containerId = req.params.id;
   let container = await dockerController.restartContainer(containerId);
   res.status(200).send(container);
});

router.delete('/containers/:id', async function(req, res, next) {
   let containerId = req.params.id;
   let container = await dockerController.removeContainer(containerId);
   res.status(204).send();
});

module.exports = router;
