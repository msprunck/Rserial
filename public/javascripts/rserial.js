!function ($) {
	"use strict"; // jshint ;_;

	// Enum for application state
	var STATE = {
		DISCONNECTED: 0,
		CONNECTING: 1,
		CONNECTED: 2,
		DISCONNECTING: 3,
		SENDING: 4
	};
	
	var currentState = STATE.DISCONNECTED;
	var timeout;

	var socket = new io.connect();

	// ========== Socket events
	socket.on('connected', function() {
		setState(STATE.CONNECTED);
	});
	socket.on('closed', function() {
		setState(STATE.DISCONNECTED); 
	});
	socket.on('data', function(data) {
		var $log = $("#log");
		$log.val($log.val() + data.data);
		setState(STATE.CONNECTED);
	});
	

	function attachEventsHandlers() {
		$("#connect").on("click", connectDisconnect);
		$("#send").on("click", send);
		$("#clear").on("click", function(e) {
			e.preventDefault();
			$("#log").val('');
		})
	}

	// ============ Template helper
	_.tpl = function(tpl, ctx) {
		var source = $("script[name=" + tpl + "]").html();
		return _.template(source, ctx);
	};

	// ============ Message functions
	function error(message) {
		showAlert(message, 'error');
	}

	function info(message) {
		showAlert(message, 'success');
	}
	
	function showAlert(message, type) {
		$(".message").html(_.tpl(type, {
			message: message
		}));
		setTimeout(function () {
          $(".alert").alert('close');
        }, 10000);
	}
	
	// ============== Manage application states
	function setState(state) {
		var button = $("#connect");
		
		switch(state) {
			case STATE.DISCONNECTED:
				button.button("reset");
				setTimeout(function () {
					button.prop('disabled', false);
				}, 100);
				$("#ports").prop("disabled", false);
				$("#baudrate").prop("disabled", false);
				$("#send").prop("disabled", true);
				stopTimeout();
				break;
			case STATE.CONNECTING:
				button.button('connecting');
				setTimeout(function () {
					button.prop('disabled', true);
				}, 100);
				break;
			case STATE.CONNECTED:
				button.button("disconnect");
				setTimeout(function () {
					button.prop('disabled', false);
				}, 100);
				$("#ports").prop("disabled", true);
				$("#baudrate").prop("disabled", true);
				$("#send").prop("disabled", false);
				stopTimeout();
				break;
			case STATE.DISCONNECTING:
				button.button("disconnecting");
				setTimeout(function () {
					button.prop('disabled', true);
				}, 100);
				break;
			case STATE.SENDING:
				$("#send").prop("disabled", true);
				break;
		}
		
		currentState = state;
	}

	// ============ Timeout to detect socket.io communication issues
	function startTimeout(fail) {
		timeout = setTimeout(function () {
			fail();
		}, 5000);
	}

	function stopTimeout() {
		window.clearTimeout(timeout);
	}

	// ============== Event handler
	function connectDisconnect(e) {
		e.preventDefault();
		if (currentState === STATE.DISCONNECTED) {
			connect();
		} else if (currentState === STATE.CONNECTED) {
			disconnect();
		}
	}

	function connect() {
		setState(STATE.CONNECTING);

		var data = {
			port: $("#ports").val(),
			baudrate: $("#baudrate").val()
		};

		socket.emit('open', data);
		startTimeout(function() {
			error("Unable to connect to the serial port.");
			setState(STATE.DISCONNECTED);
		});
	}

	function disconnect() {
		setState(STATE.DISCONNECTING);
		socket.emit('close');
		startTimeout(function() {
			error("Unable to disconnect from the serial port.");
			setState(STATE.CONNECTED); 
		});
	}

	function send(e) {
		e.preventDefault();

		var previousState = currentState;
		setState(STATE.SENDING);
		
		var data = {
			command: $("#command").val()
		};

		socket.emit('write', data);
		console.log('write');
		startTimeout(function() {
			error("Unable to send the command.");
			setState(previousState);
		});
	}

	// ============ Init
	setState(STATE.DISCONNECTED);
	attachEventsHandlers();
}(window.jQuery);