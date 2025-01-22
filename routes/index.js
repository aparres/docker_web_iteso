var express = require('express');
var router = express.Router();

const passport = require('../passport-handler')
const Container = require('../db/mongoose-handler').Container;
let dockerController = require('../controller/docker');

/* GET home page. */
router.get('/', passport.isAuthenticated, async function(req, res, next) {
  let data = await dockerController.getEngineVersion();
  let containers = await dockerController.getContainers(true);
  for(c of containers) {
    let container_dbInfo = await Container.findOne({container_id: c.Id});
    if (container_dbInfo) {
      c.owner = container_dbInfo.owner;
      c.grupo = container_dbInfo.grupo;
    } else {
      c.owner = "No owner";
      c.grupo = "No group";
    }
  }
  
  if(req.user.rol != "admin") {    
    containers = containers.filter(c => c.owner == req.user.email)  
  };

  let images = await dockerController.getImages();  
  res.render('index', { dockerData: data, containers: containers, images: images, user: req.user, show_alert: false });

});

router.get('/start/:id', async function(req, res, next) {
  let containerId = req.params.id;
  let containerDbInfo = await Container.findOne({container_id: containerId});
  
  if (req.user.rol != "admin") {
    if (containerDbInfo) {
      if (containerDbInfo.owner != req.user.email) {
        return res.redirect('/');
      }
    }
  }

  let container = await dockerController.startContainer(containerId);
  if(container) {
    let container_dbInfo = await Container.findOne({container_id: containerId});
    if (container_dbInfo) {
      container_dbInfo.container_status = "running";
      container_dbInfo.container_started = new Date();
      await container_dbInfo.save();
    }
  } 
  res.redirect('/');
});

router.get('/stop/:id', async function(req, res, next) {
  let containerId = req.params.id;

  let containerDbInfo = await Container.findOne({container_id: containerId});
  if (req.user.rol != "admin") {
    if (containerDbInfo) {
      if (containerDbInfo.owner != req.user.email) {
        return res.redirect('/');
      }
    }
  }

  let container = await dockerController.stopContainer(containerId);  
  if(container) {
    let container_dbInfo = await Container.findOne({container_id: containerId});
    if (container_dbInfo) {
      container_dbInfo.container_status = "stopped";
      container_dbInfo.container_stopped = new Date();
      await container_dbInfo.save();
    }
  }
  res.redirect('/');
});

router.get('/restart/:id', async function(req, res, next) {
  let containerId = req.params.id;

  let containerDbInfo = await Container.findOne({container_id: containerId});
  if (req.user.rol != "admin") {
    if (containerDbInfo) {
      if (containerDbInfo.owner != req.user.email) {
        return res.redirect('/');
      }
    }
  }

  let container = await dockerController.restartContainer(containerId);  
  if(container) {
    let container_dbInfo = await Container.findOne({container_id: containerId});
    if (container_dbInfo) {
      container_dbInfo.container_status = "running";
      container_dbInfo.container_started = new Date();
      await container_dbInfo.save();
    }
  }
  res.redirect('/');
});

router.get('/remove/:id', async function(req, res, next) {
  let containerId = req.params.id;

  let containerDbInfo = await Container.findOne({container_id: containerId});
  if (req.user.rol != "admin") {
    if (containerDbInfo) {
      if (containerDbInfo.owner != req.user.email) {
        return res.redirect('/');
      }
    }
  }

  let container = await dockerController.removeContainer(containerId);  
  if(container) {
    let container_dbInfo = await Container.deleteOne({container_id: containerId});
  }
  res.redirect('/');
});

router.post('/create',  passport.isAuthenticated, async function(req, res, next) {
  let postData = req.body;
  let containerName = req.user.email.split("@")[0] + '-' + postData.name;

  let containerConfig = {
    Image: postData.image,
    name: containerName,
    HostConfig: {
      PortBindings: { }
    }
  }
  
  if (postData.port) {
    let containers = await Container.find({},"container_hostPorts");
    let puertos = containers.map(c => c.container_hostPorts).flat();
    console.log(puertos);
    for(i = 5000; i < 6000; i++) {
       if (!puertos.includes(i)) {
         postData.hostPort = i.toString();
         break;
       }
    }
    containerConfig.HostConfig.PortBindings[`${postData.port}/tcp`] = [{ HostPort: postData.hostPort }];
  }
  
  console.log(containerConfig);

  let container = await dockerController.createContainer(containerConfig, req.user);
  if(container) {
    let containerData = {
      container_id: container.id,
      container_name: containerName,
      container_image: postData.image,
      container_status: "created",
      container_portsBiding: JSON.stringify(containerConfig.HostConfig.PortBindings),
      container_hostPorts: [postData.hostPort],
      container_created: new Date(),
      container_started: null,
      container_stopped: null,
      container_logs: "",
      owner: req.user.email,
      grupo: req.user.grupo
    }
    let containerModel = new Container(containerData);
    await containerModel.save();
  }

  res.redirect('/');
});

module.exports = router;
