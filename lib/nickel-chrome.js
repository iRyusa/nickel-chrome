let onExit = (() => {
  var _ref3 = _asyncToGenerator(function* () {
    yield scheduler.stopWorkers();
    process.exit();
  });

  return function onExit() {
    return _ref3.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const { version } = require('../package.json');
const scheduler = require('./scheduler');
const parseBody = require('./parseBody');
const log = require('./log');
const createServer = require('./createServer');

const minimalHtml = "<!doctype html><html lang=en><head><meta charset=utf-8><title>blah</title></head><body><p>I'm the content</p></body></html>";

module.exports = nickelChrome = (_ref) => {
  let { port, nbWorkers } = _ref,
      config = _objectWithoutProperties(_ref, ['port', 'nbWorkers']);

  if (config.logguer) {
    log.setLogguer(config.logguer);
  }

  log.log(`
     ╔═════════════════════╗
     ║                   ║
     ║   NICKEL-CHROME   ║
     ║                   ║
     ╟─────────────────────╢
     ║ ${version}             ║
     ╚═════════════════════╝
  `);

  scheduler.launchWorkers(nbWorkers);

  createServer(port, (() => {
    var _ref2 = _asyncToGenerator(function* (req, res) {
      try {
        log.log('Receiving request');
        const now = Date.now();

        // Get body, or use dummy html if it's an healthcheck
        let payload = null;
        if (['HEAD', 'GET'].includes(req.method) && req.url === '/healthcheck') {
          payload = {
            html: minimalHtml
          };
        } else {
          payload = yield parseBody(req);
        }

        // Actually ask chrome workers for the screenshot
        const base64 = yield scheduler.screenshot(payload);
        log.log(`Screenshot done in ${Date.now() - now}ms`);

        // Send response to client
        res.writeHead(200);
        res.end(base64);
      } catch (err) {
        log.error(err);
        res.writeHead(500);
        res.end('KO');
      }
    });

    return function (_x, _x2) {
      return _ref2.apply(this, arguments);
    };
  })());
};

process.on('exit', onExit);
process.on('SIGINT', onExit);