var SerialPort = require("serialport");
var child_process = require('child_process');

function list(callback){
    callback = callback || function (err, ports){};
    if (process.platform !== 'darwin'){
        serialport.list(function(err, ports){
            out = [];
            ports.forEach(function(port){
                out.push(port.comName);
            });
            callback(null, out);
        });
        return;
    }

    child_process.exec('ls /dev/tty.*', function(err, stdout, stderr){
        if (err) return callback(err);
        if (stderr !== "") return callback(stderr);
        return callback(null, stdout.split("\n").slice(0,-1));
    });
};

exports.index = function(req, res){
  list(function (err, ports) {
  	res.render('index', { title: 'Rserial', ports: ports });
  });
};