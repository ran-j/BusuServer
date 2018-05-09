	var socket = io();
	var ousucone=0;
	var map;
	var onibus = [];
	
	function initMap() {
		var divrota = document.getElementById('rota');
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -21.761207, lng: -41.327646},
          zoom: 15
        });
		
		infowindowbus = new google.maps.InfoWindow({
			content: 'oi'
		});
		
		var control = document.getElementById('floating-panel');
        control.style.display = 'block';
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);
		
		var onChangeHandler = function() {
			var rota = divrota.value;
			
			if (rota){
				if(rota == 555555){
					for (i=0; i < asrotas.length; i++){
						cria(asrotas[i].v,cores[i].v,false,asrotas[i].title);
					}
				}else{
					limparMapa();
					cria(asrotas[rota].v,cores[0].v,true,asrotas[rota].title);
				}
			}else{
				limparMapa();
			}
		  
        };
        divrota.addEventListener('change', onChangeHandler);

	}
	


	socket.on('attuser', function(usucone){
		ousucone = usucone;
		if (ousucone < 0){ ousucone = 0; }
		
		if (ousucone>=2){
			$('#usu').text("Usuários Conectados: "+ousucone);
			
		}else{
			$('#usu').text("Usuário Conectado: "+ousucone);
		}	
	});
	 
	socket.on('attbusu', function(lata, lnge, iddobus, pos, hora, statusBus){
		
		// Historico
        var time = hora.split(" "); 
		$('#bustable').append('<tr><td>'+iddobus+'</td><td>'+lata+'</td><td>'+lnge+'</td><td>'+time[0]+'</td><td>'+time[1]+'</td></tr>');
			 
		var posBus = new google.maps.LatLng(lata, lnge);
		  
		if (onibus[pos]){
			onibus[pos].setPosition(posBus);
			
		} else {
			// Criando a marcação dos onibus
			createMarkerBus(posBus, iddobus, pos, statusBus);
		}
		 
	});
	
	socket.emit("Cadastro", "Painel");
	socket.emit('infordosbus');
	socket.on('rinfordosbus', function(aBus){
		
		for (var i=0; i<aBus.length; i++) {
			var posBus = new google.maps.LatLng(aBus[i].lat, aBus[i].lng);
			
			// Criando a marcação dos onibus
			createMarkerBus(posBus, aBus[i].id, i, aBus[i].statusBus);
		}
		
	});
	
	function createMarkerBus(posBus, idBus, posArray, statusBus) {
		var titulo = "Onibus "+ idBus;
		
		var contentString = `<div class="tag">`+ idBus 
		+`</div>`;
			 
		var infowindow = new google.maps.InfoWindow({
          content: contentString
        });
		
		var marker = new google.maps.Marker({
				position: posBus,
				icon: verifyStatus(statusBus),
				title: titulo,
				map: map
			});
					
			marker.addListener('click', function() {
				infowindow.open(map, marker);
			});
		
			onibus[posArray] = marker;
	}
	
	function verifyStatus(statusBus) {
		
		// Verificando se o onibus está ligado
		if(statusBus.localeCompare("On") == 0) {
			return "/img/bussicon.png";
		} else {
			return "/img/busred.png";
		}
		
	}
		
	
	function tombageral(){
		socket.emit('tombageral');
		ousucone = 0;
		$('#usu').text("Usuário Conectado: "+ousucone);
		loca.reload(); 
	}
	
	function aofechar() {
		socket.emit('fechopainel');
	}
	
	var rotasbus;
	var arrayrotasbus = [];
	var infowindowbus;
	function cria(rotascoordenadas,cor,apagar,titulo){
		//apaga antigas
		if(apagar){if (rotasbus){rotasbus.setMap(null);}}
				
		rotasbus = new google.maps.Polyline({
			path: rotascoordenadas,
			strokeColor: cor,
			strokeOpacity: 1.0,
			strokeWeight: 5
		});
	
		rotasbus.setMap(map);
		
		arrayrotasbus.push(rotasbus);
		
		google.maps.event.addListener(rotasbus, 'mouseover', function(e) {
			infowindowbus.setPosition(e.latLng);
			infowindowbus.setContent(titulo);
			infowindowbus.open(map);
		});

	
		google.maps.event.addListener(rotasbus, 'mouseout', function() {
			infowindowbus.close();
		});
	}
	
	function limparMapa(){
		for (i=0;i < arrayrotasbus.length ;i++){
			if (arrayrotasbus[i]){
				arrayrotasbus[i].setMap(null);
			}
		}
		arrayrotasbus = [];
	}
	
 
