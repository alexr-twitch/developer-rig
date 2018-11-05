const { normalize, join } = require('path');
const project = require('./project');
const rmrf = require('./rmrf');

// Configure the project module.
const getRoutes = {};
const postRoutes = {};
const app = {
  use: (_) => { },
  get: (route, fn) => (getRoutes[route] = fn),
  post: (route, fn) => (postRoutes[route] = fn),
};
project(app);
const res = {
  setHeader: (name, value) => {
    console.log(`set header ${name} to ${value}`);
  },
  writeHead: (statusCode) => {
    console.log(`write head ${statusCode}`);
  },
  end: (s) => {
    console.log('end');
    console.log(s);
  },
};

runTests();

async function runTests() {
  // Test coordinator fetch.
  await getRoutes['/coordinator'](null, res);

  // Test supervisor fetch.
  await getRoutes['/supervisor.html'](null, res);
  await getRoutes['/supervisor.css'](null, res);
  await getRoutes['/supervisor.js'](null, res);

  // Test stats fetch.
  await postRoutes['/v1/stats'](null, res);

  // Test project creation.
  const projectFolderPath = normalize(join(__dirname, '..', 'build', 'project-test'));
  const req = {
    body: {
      projectFolderPath,
      codeGenerationOption: 'scaffolding',
      exampleIndex: 0,
    },
  };
  rmrf(projectFolderPath);
  await postRoutes['/project'](req, res);
  rmrf(projectFolderPath);
  req.body.codeGenerationOption = 'none';
  await postRoutes['/project'](req, res);
  await postRoutes['/project'](req, res);
  req.body.codeGenerationOption = 'scaffolding';
  await postRoutes['/project'](req, res);
  rmrf(projectFolderPath);
  req.body.codeGenerationOption = 'example';
  await postRoutes['/project'](req, res);

  // Test the back-end.
  await postRoutes['/backend']({
    body: {
      backendCommand: `node ${join('extensions-hello-world', 'services', 'backend')} -c "{clientId}" -s "{secret}" -o "{ownerId}"`,
      projectFolderPath,
    },
  }, res);

  // Test the front-end.
  await postRoutes['/frontend']({
    body: {
      frontendFolderPath: join('extensions-hello-world', 'public'),
      port: 8080,
      projectFolderPath,
    },
  }, res);

  // Test shut down.
  await postRoutes['/stop']({ body: { stopOptions: 3 } }, res);

  // Test the custom front-end.
  await postRoutes['/frontend']({
    body: {
      frontendCommand: 'node --version',
      frontendFolderPath: 'extensions-hello-world',
      projectFolderPath,
    },
  }, res);
}
