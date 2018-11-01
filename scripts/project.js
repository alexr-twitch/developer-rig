module.exports = function(app) {
  const childProcess = require('child_process');
  const fs = require('fs');
  const { isAbsolute, join } = require('path');
  const children = {
    backend: null,
    frontend: null,
  };

  app.use(require('body-parser').json());

  const examples = [
    {
      title: 'Hello World',
      description: 'Click a button to change the color on a circle.',
      repository: 'twitchdev/extensions-hello-world',
      frontendFolderName: join('extensions-hello-world', 'public'),
      frontendCommand: '',
      backendCommand: `node ${join('extensions-hello-world', 'services', 'backend')} -c "{clientId}" -s "{secret}" -o "{ownerId}"`,
      npm: ['i'],
      sslFolderName: 'conf',
      expectedDuration: 'a quarter of a minute',
    },
    {
      title: 'Boilerplate',
      description: 'Front-end-only React-based example to get you started building quickly.',
      repository: 'twitchdev/extensions-boilerplate',
      frontendFolderName: 'extensions-boilerplate',
      frontendCommand: 'npm run host',
      backendCommand: '',
      npm: ['i'],
      sslFolderName: 'conf',
      expectedDuration: 'a minute',
    },
    {
      title: 'Bot Commander',
      description: 'Front-end-only React-based example that leverages Configuration Service.',
      repository: 'twitchdev/bot-commander',
      frontendFolderName: 'bot-commander',
      frontendCommand: 'npm run host',
      backendCommand: '',
      npm: ['i'],
      sslFolderName: 'conf',
      expectedDuration: 'a minute',
    },
    {
      title: 'Animal Facts (requires Go 1.10+)',
      description: 'Example with React-based front-end and back-end service that leverages Configuration Service.',
      repository: 'twitchdev/animal-facts',
      frontendFolderName: 'animal-facts',
      frontendCommand: 'npm run host',
      backendCommand: '',
      npm: ['i'],
      sslFolderName: 'conf',
      expectedDuration: 'a minute',
    },
  ];

  app.get('/examples', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(examples));
  });

  app.post('/backend', async (req, res) => {
    const { backendCommand, projectFolderPath } = req.body;
    try {
      const args = parseCommandLine(backendCommand);
      const options = {};
      if (projectFolderPath) {
        options.cwd = projectFolderPath;
      }
      const command = args.shift();
      const { child, exitCode } = await spawn(command, args, options, true);
      if (exitCode) {
        throw new Error(`Back-end command exited with exit code ${exitCode}`);
      }
      children.backend = child;
      res.writeHead(204);
      res.end();
    } catch (ex) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      res.end(JSON.stringify({ name: ex.name, message: ex.message }));
    }
  });

  app.post('/frontend', async (req, res) => {
    const { projectFolderPath, frontendCommand, frontendFolderPath, port } = req.body;
    try {
      let args = [], command;
      const options = {};
      if (frontendCommand) {
        args = parseCommandLine(frontendCommand);
        command = args.shift();
        if (isAbsolute(frontendFolderPath)) {
          options.cwd = frontendFolderPath;
        } else if (projectFolderPath) {
          options.cwd = join(projectFolderPath, frontendFolderPath);
        }
        if (process.platform === 'win32') {
          options.shell = true;
        }
      } else {
        args = [
          join('scripts', 'host.js'),
          '-d',
          isAbsolute(frontendFolderPath) ? frontendFolderPath : join(projectFolderPath, frontendFolderPath),
          '-p',
          port,
        ];
        command = 'node';
      }
      const { child, exitCode } = await spawn(command, args, options, true);
      if (exitCode) {
        throw new Error(`Back-end command exited with exit code ${exitCode}`);
      }
      children.frontend = child;
      res.writeHead(204);
      res.end();
    } catch (ex) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      res.end(JSON.stringify({ name: ex.name, message: ex.message }));
    }
  });

  app.post('/project', async (req, res) => {
    console.log('starting project creation');
    const { projectFolderPath, codeGenerationOption, exampleIndex } = req.body;
    let deleteOnError = false;
    try {
      if (isAbsolute(projectFolderPath)) {
        if (!fs.existsSync(projectFolderPath)) {
          fs.mkdirSync(projectFolderPath);
        } else if (codeGenerationOption !== 'none' && fs.readdirSync(projectFolderPath).length) {
          throw new Error(`Invalid project folder "${projectFolderPath}"; it must be empty`);
        }
        deleteOnError = true;
      } else {
        throw new Error(`Invalid project folder "${projectFolderPath}"; it must be an absolute path`);
      }
      if (codeGenerationOption === 'example') {
        const { repository, npm, sslFolderName, expectedDuration } = examples[exampleIndex];
        if (expectedDuration) {
          console.log(`This will take about ${expectedDuration}.`);
        }
        if (repository) {
          const exampleFolderPath = await fetchExample(repository, projectFolderPath);
          // If necessary, run npm.
          if (npm) {
            await spawn('npm', npm, {
              cwd: exampleFolderPath,
              shell: true,
            });
          }

          // If necessary, copy SSL certificates.
          if (sslFolderName) {
            const sslFolderPath = join(exampleFolderPath, sslFolderName);
            if (!fs.existsSync(sslFolderPath)) {
              fs.mkdirSync(sslFolderPath);
            }
            ['crt', 'key'].forEach((ext) => fs.copyFileSync(join('ssl', `selfsigned.${ext}`), join(sslFolderPath, `server.${ext}`)));
          }
        } else {
          throw new Error('TODO:  handle non-GitHub examples.');
        }
      } else if (codeGenerationOption === 'scaffolding') {
        // TODO:  handle scaffolding.
      }
      console.log('successfully created project in', projectFolderPath);
      res.writeHead(204);
      res.end();
    } catch (ex) {
      if (deleteOnError) {
        require('./rmrf')(projectFolderPath);
      }
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      res.end(JSON.stringify({ name: ex.name, message: ex.message }));
      console.error(ex);
    }
  });

  app.get('/status', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    const status = {
      isBackendRunning: !!children.backend,
      isFrontendRunning: !!children.frontend,
    };
    res.end(JSON.stringify(status));
  });

  const StopOptions = {
    Backend: 1,
    Frontend: 2,
  };

  app.post('/stop', async (req, res) => {
    const { stopOptions } = req.body;
    const backendResult = stopOptions & StopOptions.Backend ? await stop(children.backend) : '';
    const frontendResult = stopOptions & StopOptions.Frontend ? await stop(children.frontend) : '';
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    const status = {
      backendResult,
      frontendResult,
    };
    res.end(JSON.stringify(status));

    async function stop(child) {
      if (child) {
        if (process.platform === 'win32') {
          childProcess.spawnSync('taskkill', ['/f', '/pid', child.pid, '/t']);
        } else {
          child.kill();
        }
        return await new Promise((resolve, _) => {
          let hasResolved = false;
          child.stderr.on('data', (data) => process.stderr.write(data.toString()));
          child.stdout.on('data', (data) => process.stdout.write(data.toString()));
          child.on('error', (ex) => {
            hasResolved = hasResolved || (resolve(ex.message), true);
          });
          child.on('exit', (_) => {
            hasResolved = hasResolved || (resolve('exited'), true);
            if (child === children.backend) {
              children.backend = null;
            } else {
              children.frontend = null;
            }
          });
        });
      }
      return 'not running';
    }
  });

  async function fetchExample(repository, projectFolderPath) {
    // Determine if git is available.
    const exampleFolderName = repository.split('/')[1];
    const exampleFolderPath = join(projectFolderPath, exampleFolderName);
    const versionResult = childProcess.spawnSync('git', ['--version']);
    if (!versionResult.error && !versionResult.status) {
      // Try to clone it using git.
      const cloneUrl = `https://github.com/${repository}.git`;
      const { exitCode } = await spawn('git', ['clone', '--', cloneUrl, exampleFolderPath]);
      if (exitCode === 0) {
        // Successfully cloned the repository.
        return exampleFolderPath;
      } else {
        // Failed to clone the repository.
        throw new Error(`git failed with error code ${exitCode}`);
      }
    } else {
      // Try to fetch the Zip file and unzip it.
      return new Promise((resolve, reject) => {
        const handleError = (ex) => {
          // Failed to fetch or unzip the Zip file.
          reject(ex);
          reject = (_) => { };
        };
        const zipUrl = `https://github.com/${repository}/archive/master.zip`;
        const zip = '.master.zip';
        const zipRequest = require('request')(zipUrl);
        const writeStream = fs.createWriteStream(zip);
        const zipPipe = zipRequest.pipe(writeStream);
        [zipRequest, writeStream, zipPipe].forEach((value) => value.on('error', handleError));
        zipPipe.on('close', () => {
          const readStream = fs.createReadStream(zip);
          const extractor = require('unzip').Extract({ path: projectFolderPath });
          const unzipPipe = readStream.pipe(extractor);
          [readStream, extractor, unzipPipe].forEach((value) => value.on('error', handleError));
          unzipPipe.on('close', () => {
            // Successfully fetched and unzipped the Zip file.
            try {
              fs.unlinkSync(zip);
              fs.renameSync(`${exampleFolderName}-master`, exampleFolderName);
              resolve(exampleFolderPath);
            } catch (ex) {
              handleError(ex);
            }
          });
        });
      });
    }
  }

  function parseCommandLine(commandLine) {
    let quote = '';
    const arg = [], args = [];
    commandLine.split('').forEach((ch) => {
      if (quote === '') {
        if (ch === ' ') {
          args.push(arg.join(''));
          arg.length = 0;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
        } else {
          arg.push(ch);
        }
      } else if (ch === quote) {
        quote = '';
      } else {
        arg.push(ch);
      }
    });
    if (arg.length) {
      args.push(arg.join(''));
    }
    return args;
  }

  async function spawn(command, args, options, wantsTimeout) {
    const child = childProcess.spawn(command, args, options);
    const exitCode = await new Promise((resolve, reject) => {
      let hasResolved = false, timerId;
      child.stderr.on('data', (data) => process.stderr.write(data.toString()));
      child.stdout.on('data', (data) => process.stdout.write(data.toString()));
      child.on('error', (ex) => reject(ex));
      child.on('exit', (code) => {
        hasResolved = hasResolved || (clearTimeout(timerId), resolve(code), true);
      });
      if (wantsTimeout) {
        timerId = setTimeout(() => {
          hasResolved = hasResolved || (resolve(), true);
        }, 999);
      }
    });
    if (child.error || child.status) {
      throw child.error || new Error(child.stderr.toString());
    }
    return { child, exitCode };
  }
};
