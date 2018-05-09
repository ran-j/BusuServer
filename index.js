var fs = require("fs");
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const dgram = require('dgram');
const ServerUPD = dgram.createSocket('udp4');


//onivus salvos
var Onibus = [];

//cliente conectador
var clients = [];

//paineis
var paineis = [];


app.get('/', function(req, res){//rota  
	app.use(express.static(__dirname + '/public'));
	res.sendFile(__dirname + '/template/index.html');
});

var server = http.listen(25555, function(){
	console.log(" "); 
	console.log('Server online na porta: '+server.address().port);
	DesconectaUsuarios();
	console.log(" ");
	console.log('Total de 0 Usuario(s) conectados(s)');
	
	//verifica e carrega um json com os busu salvos
	fs.exists('./BususSalvos.json', function(exists) { 
		if (exists) { 
			Onibus = require("./BususSalvos.json");
			console.log(" ");
			console.log("Busus Salvos :"+Onibus.length);
			console.log(" ");
		} 
	}); 	
	
	ServerUPD.on('message',(msg,rinfo) => {
		var aDados   = `${msg}`;
		var ip       = `${rinfo.address}`;
		var porta    = `${rinfo.port}`;
		//console.log(aDados);
		// IP do Servidor da NewGPS
		if(ip == " " || ip == " " || ip == " " || ip == " ") {

			// Seprando os dados recebidos 
			var veiculo     = getParameterByName('vei', aDados);						// ID do veiculo
			var longitude   = getParameterByName('lon', aDados).replace(',', '.');		// Longitude
			var latitude    = getParameterByName('lat', aDados).replace(',', '.');		// Latitude
			var atualizado  = getParameterByName('dat', aDados);						// Ultima Atualizacao
			var statusBus   = getParameterByName('ign', aDados);						// Status do veiculo, ligado ou desligado
		  
			// Verificando se o veiculo está contido no array
			if (_isContains(Onibus, veiculo)){ 
			
				//pega no array a localização do busu
				var pos = Onibus.map(function(d) { return d['id']; }).indexOf(veiculo);
	
				if(Onibus[pos].lat != latitude && Onibus[pos].lng != longitude){
					// Atualiza o Array				
					Onibus[pos].lat       = latitude;
					Onibus[pos].lng       = longitude;
					Onibus[pos].id        = veiculo;
					Onibus[pos].hora      = atualizado;
					Onibus[pos].statusBus = statusBus;
				}
				
				//provisorio
				io.emit('attbusu', Onibus[pos].lat, Onibus[pos].lng, Onibus[pos].id, pos, Onibus[pos].hora, statusBus);
				
			} else {
				
				// Cria um elemento no array
				Onibus.push({lat : latitude , lng : longitude, id : veiculo, hora : atualizado, statusBus : statusBus}); 
				
				var pos = Onibus.map(function(d) { return d['id']; }).indexOf(veiculo);
				
				//provisorio
				io.emit('attbusu', Onibus[pos].lat, Onibus[pos].lng, Onibus[pos].id, pos, Onibus[pos].hora, statusBus);
			}
			
			//salva o json dos busus
			fs.writeFile( "BususSalvos.json", JSON.stringify( Onibus ), "utf8");
			
			console.log("Total Busu: "+ Onibus.length + " Veiculo: "+  veiculo + " Longitude: " + longitude + " Latitude: " + latitude + " Ultima Atualizacao: " + atualizado);
	
		} else {
			console.log("*** Recebendo pacote de IP desconhecido: " + ip + " PORTA: " + porta);
		}
		
	});
	
	ServerUPD.bind(25555);
	
	//Tratamento de conexõe do sockets
	io.on("connection", function (client) {
	
		client.on("Cadastro", function(name){
			console.log(" ");
			console.log("Joined: " + name);
			console.log(" ");
			
			if(name == "Painel"){
			
				paineis[paineis.length] = { id : client.id };
				console.log("Painel administrativo aberto");
				console.log("Total de " + paineis.length+" aberto(s)");

			}else{
		
				clients[clients.length] = { id : client.id };
				console.log("Usuario de ID "+client.id+ " conectado");
				console.log("Total de " + clients.length+" conectado(s)");
			
			}
		
			//mandar o array com os bus para o cliente
			client.on('infordosbus', function(){ 
				io.emit('rinfordosbus',Onibus); 
			});
			
			//solicitação fantasma para teste
			client.on('teste', function(){ 
				specifcEmit(client.id,"new-message","Hello from the server sideeeee");
			});
			
		});

		client.on("disconnect", function(){
			console.log(" ");
			var pos = clients.map(function(d) { return d['id']; }).indexOf(client.id);
			if (clients[pos]){
				clients.splice(pos);
				console.log("Usuario desconectado");
				console.log("Total de " + clients.length+" conectado(s)");
			}else{
				pos = paineis.map(function(d) { return d['id']; }).indexOf(client.id);
				paineis.splice(pos);
				console.log("Painel administrativo fechado");
				console.log("Total de " + paineis.length+" aberto(s)");
			}
		});
	});
	
	function HoradoServidor(){
		return new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
	}
	
	function DesconectaUsuarios(){ 
		console.log(" ");
		console.log("Desconectando usuarios");
		io.emit('forceDisconnect');
	}
	
	function _isContains(json, value) {
		let contains = false;
		Object.keys(json).some(key => {
			contains = typeof json[key] === 'object' ? _isContains(json[key], value) : json[key] === value;
			return contains;
		});
		return contains;
	}  
	
	function getParameterByName(name, url) {
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
	
	//envia resposta para um cliente especifico
	function specifcEmit(Clienteid,eventS,message){
		if (io.sockets.connected[Clienteid]) {
			io.to(Clienteid).emit(eventS, message);
		}else{
			console.log(" ");
			console.log("Cliente desconectado ou nao reconhecido");
		}
	}
 
});

 


