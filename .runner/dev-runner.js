'use strict'

const chalk = require('chalk')
const electron = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const mainConfig = require('./main.webpack.config.js')
const rendererConfig = require('./renderer.webpack.config.js')

let electronProcess = null
let manualRestart = false



function init () {
  console.log(chalk.yellow.bold('\n --------------------- '))
  console.log(chalk.yellow.bold('\n -- GETTING STARTED -- '))
  console.log(chalk.yellow.bold('\n --------------------- \n'))

  Promise.all([startRenderer(), startMain()])  
    .then(() => {
      console.log('\n');
      startElectron()
    })
    .then(()=> {
      console.log('Electron Ready \n')
    })
    .catch(err => {
      console.error(err)
    })
}
init()


function startMain () {
  return new Promise((resolve, reject) => {
    //mainConfig.entry.main = [path.join(__dirname, '../src/main/index.js')].concat(mainConfig.entry.main)
    mainConfig.mode = 'development'
    const compiler = webpack(mainConfig)

    compiler.watch({}, (err, stats) => {   
      if (err) {
        console.log(err)
        return 
      }
      
      logStats('Main', stats)

      if (electronProcess && electronProcess.kill) {
        manualRestart = true
        process.kill(electronProcess.pid)
        electronProcess = null
        startElectron()

        setTimeout(() => {
          manualRestart = false
        }, 5000)
      }

      resolve()
    })
  })
}

function startRenderer () {
  return new Promise((resolve, reject) => {
    rendererConfig.mode = 'development'
    const compiler = webpack(rendererConfig) 

    const server = new WebpackDevServer({
      static: path.join(__dirname, '../'),
      hot: true,     
      client: {
        progress: true,
        logging: 'info',
      },
      onListening: function (devServer) {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }  
        const port = devServer.server.address().port;
        console.log('DevServer listening on port:', port, '\n');
      }
    }, compiler)  

    server.start(8080, 'localhost')   
    
    compiler.hooks.done.tap('done', stats => {
      logStats('Renderer', stats)      
      console.log('Renderer done \n')
      resolve()
    })  
  })
}





function startElectron () {
  console.log('Starting Electron ... \n')

  var args = [
    '--inspect=5858',
    path.join(__dirname, '../dist/electron/main.js')
  ]

  // detect yarn or npm and process commandline args accordingly
  if (process.env.npm_execpath.endsWith('yarn.js')) {
    args = args.concat(process.argv.slice(3))
  } else if (process.env.npm_execpath.endsWith('npm-cli.js')) {
    args = args.concat(process.argv.slice(2))
  }

  electronProcess = spawn(electron, args)
  
  electronProcess.stdout.on('data', data => {
    electronLog(data, 'blue')
  })
  
  electronProcess.stderr.on('data', data => {
    electronLog(data, 'red')
  })

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit()
  })
}


function electronLog (data, color) {
  let log = ''
  data = data.toString().split(/\r?\n/)
  data.forEach(line => {
    log += `  ${line}\n`
  })
  if (/[0-9A-z]+/.test(log)) {
    console.log(
      chalk[color].bold('┏ Electron -------------------') +
      '\n\n' +
      log +
      chalk[color].bold('┗ ----------------------------') +
      '\n'
    )
  }
}


function logStats (proc, data) {
  let log = ''

  log += chalk.yellow.bold(`┏ ${proc} Process ${new Array((19 - proc.length) + 1).join('-')}`)
  log += '\n\n'

  if (typeof data === 'object') {
    data.toString({
      colors: true,
      chunks: false
    }).split(/\r?\n/).forEach(line => {
      log += '  ' + line + '\n'
    })
  } else {
    log += `  ${data}\n`
  }

  log += '\n' + chalk.yellow.bold(`┗ ${new Array(28 + 1).join('-')}`) + '\n'

  console.log(log)
}