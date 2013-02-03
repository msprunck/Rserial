var SerialPort = require("serialport");

var DEBUG = true;

function registerSocketEvents(socket) {
	// Open serial connection
	socket.on('open', function (data) {
		debug('********** MSG OPEN');
		var sp = new SerialPort.SerialPort(data.port, {
			baudrate: parseInt(data.baudrate),
			parser: SerialPort.parsers.readline("\n")
		});
		socket.set('serial', sp, function() {
			registerSerialEvents(sp, socket);
		});
	});

	// Disconnection of the socket client
	socket.on('disconnect', function () {
		socket.get('serial', function(err, sp) {
			if (sp) {
				sp.close();
			}
		});
  	});

  	socket.on('close', function() {
		debug('********** MSG CLOSE');
		socket.get('serial', function(err, sp) {
			if (sp) {
				sp.close();
			}
		});
		socket.emit('closed');
	});
	
	socket.on('write', function(data) {
		debug('********** MSG WRITE ' + data.command);
		socket.get('serial', function(err, sp) {
			if (sp) {
				sp.write(data.command, function(err, results) {
					console.log("err: " + err);
		    		console.log("results: " + results);
				});
				sp.flush();
			}
		});
	});
}

function registerSerialEvents(sp, socket) {
	// emit
	sp.removeAllListeners('open');
	sp.removeAllListeners('data');
	sp.removeAllListeners('close');
	sp.on('open', function() {
		debug('********** SERIAL OPEN');
		socket.emit('connected');

		sp.on('data', function(data) {
	    	debug('********** SERIAL DATA ' + data);
			socket.emit('data', {data: data});
	  	});

	  	sp.on('close', function() {
	  		debug('********** SERIAL CLOSED');
			socket.emit('closed');
	  	});
	});

  	sp.on('error', function(error) {
  		console.log(error);
  	});
}

function debug(msg) {
	if (DEBUG) {
		console.log(msg);
	}
}

exports.listen = function(io) {
	io.sockets.on('connection', function (socket) {
		console.log('New IO Connection');
		registerSocketEvents(socket);
	});
};