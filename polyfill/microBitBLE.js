/**
	micro:bit BLE I2C and GPIO and sensors driver for Chromium / WebBluetooth
	
	Through Web Bluetooth, you can easily use micro:bit I2C , GPIO I/F from Chromium|Chrome which supported bluetooth.	
	Supports WebI2C and WebGPIO APIs, so this is one of the CHIRIMEN implementation ;)
	
	Also Supports micro:bit's embedded Buttons, matrixLEDs, Accelerometer, Magnetometer, Thermometer, Lightmeter with special APIs
	
	=======================================================================================================
	Programmed by Satoru Takagi
	Copyright 2019 by Satoru Takagi All Rights Reserved
	
	=======================================================================================================
	License: (GPL v3)
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License version 3 as
	published by the Free Software Foundation.
	
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
	
	
	=======================================================================================================
	History:
	(このドライバの更新履歴)
	2019.3.7: Rev6: micro:bitのファームをリファクタリング(結局メモリが足りなくなる・・・)、それに伴いこちらのコードもリファクタリング・・
	2019.6.18: Rev7: ついにファームメモリオーバーフロー解消？　GPIOもサポート　あとはonChange系と終了時処理系
	2019.6.21: GPIO analog INをサポートする、pullModeを設定可能に・・
	2019.6.25: onchangeを実装。　ただしこのドライバがBLE経由でポーリングしている・・・
	
	=======================================================================================================
	Firm Ware on micro:bit:
	 (以下の中の最新リビジョンのファームとのペアで本ドライバは動作するようになっています)
	この版では、完全にリファクタリングした・・
	https://makecode.microbit.org/_8PsJJmh5F1W3  "W"コマンドのみ
	https://makecode.microbit.org/_C30W7EP3shUP "W"及び"R"サポート：　だいぶ進んだがまだ不安定、readとwriteを混在させるとおかしくなったり、動かしつつけるとconnection切れたりする。
	https://makecode.microbit.org/_cmbD852LJ4Wv    2019/5/27 リファクタリング　ほとんどをcustom ns下に移動し　buffer関連のメモリリーク？エラーを解決しようとしてる
	https://makecode.microbit.org/_cKR1R7M9ee4w    2019/5/28 内蔵センサをイネーブルに　ただし、一度でも内蔵センサを使うと、これでNeopixel I2Cで LED 64個を併用するとERR020が必ず起きる　メモリーが足りない...　打つ手はないような気がする　192バイトBufferが取れない。micro:bit側のi2cwritebufferでcontinueを入れても分割送信は無理だった・・
	
	==ここでようやくメモリオーバーフローの長いトンネルを抜けました・・・
	2019.6.18: Rev11 : WebGPIO https://makecode.microbit.org/_Uuxca6Mp0Cr2  ついに結構安定板ができた！！！ 
	2019.6.19: https://makecode.microbit.org/_XrUF6yJbg6Fp 少し綺麗に？
	2019.6.21: https://makecode.microbit.org/_9uyik75iiXMF  GPIOの動作をチェック pullModeの指定を可能にしてanalogIn動くように・・ 
	2019.6.25: https://makecode.microbit.org/_d4hA9cWMz5rC 少しきれいにした程度　本当はネイティブonchangeを入れようとしたが020ERR...
	
	=======================================================================================================
	
	References:
	Customを使わないとヒープ減らせないか作戦・・https://makecode.microbit.org/_iXdKFUieAWFz
	
	https://github.com/lancaster-university/microbit-dal/issues/390 これは参考になる　 2.1.0はほとんどBLE使い物にならないらしい　https://github.com/lancaster-university/microbit-dal/issues/390#issuecomment-426156052　はいろいろdisableにすると使える！
	BT省メモリ化可能な開発(コンパイル)環境：https://makecode.microbit.org/app/ceebbcc016c631523a6f1ea8d5ba9523b0e5c213-c728c358f3
	上のツールで設定される値をpxt.jsonに直接書けばうまく動くようになる？
	https://makecode.microbit.org/_Te0UcjJDRVfR　　rev8はこれをやってるだけ ->うまく動くかんじ！！！
	
	see also 
	https://lancaster-university.github.io/microbit-docs/ble/profile/ 
	https://lancaster-university.github.io/microbit-docs/resources/bluetooth/bluetooth_profile.html
	https://relativelayout.hatenablog.com/entry/2018/02/03/013251
	https://github.com/edrosten/bluez/blob/master/monitor/uuid.c (Huge Dicts!)
	https://tknc.jp/tp_detail.php?id=360
	https://makecode.microbit.org/v0/06016-09825-51608-35581
	
	micro:bitでADT7410
	https://yamamoto-works.hatenablog.com/entry/2018/12/23/233953
	
	i2cWriteNumber
	i2cReadNumber
	i2cWriteBuffer (ブロックとしてはない)
	i2cReadBuffer (ブロックとしてはない)
	https://makecode.microbit.org/reference/pins/i2c-write-buffer
	https://github.com/Microsoft/pxt-microbit/blob/master/libs/core/pins.ts
	https://github.com/adafruit/pxt-seesaw/blob/master/seesaw.ts	
	
	I2Cのwriteはなんかi2cWriteNumberをtrue,false連続で送る方法は効かない感じがする・・
	8bitなら、これで送る感じ？  
	http://robert-fromm.info/?post=elec_i2c_calliope
		pins.i2cWriteNumber(addr, reg * 256 + value, NumberFormat.UInt16BE)
	
	
	I2Cについて
	http://www.picfun.com/f1/f06.html　基本
	http://s-ajisaka.hatenablog.com/entry/2017/06/29/003636　レジスタについて
	

	
	micro:bit UART側がこちらに一度に送れる文字列長は20文字！！
	
	
	I2Cはこのへん
	https://makecode.microbit.org/reference/pins/i2c-read-number
	https://yamamoto-works.hatenablog.com/entry/2018/12/23/233953
	
	これも使えるはず
	https://makecode.microbit.org/reference/pins/i2c-write-buffer
	https://makecode.microbit.org/reference/pins/i2c-read-buffer
**/

( function ( window , undefined ) {
	var document = window.document;
	var navigator = window.navigator;
	var location = window.location;


	var microBitBleFactory = ( function(){ 
		var pollingInterval = 500;

		var microBitUUIDs = {
			//micro:bit BLE UUID
			/* BBC micro:bit Bluetooth Profiles */
			"MicroBit Accelerometer Service": "e95d0753-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Accelerometer Data": "e95dca4b-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Accelerometer Period": "e95dfb24-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit Magnetometer Service": "e95df2d8-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Magnetometer Data": "e95dfb11-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Magnetometer Period": "e95d386c-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Magnetometer Bearing": "e95d9715-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit Button Service": "e95d9882-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Button A State": "e95dda90-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Button B State": "e95dda91-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit IO PIN Service": "e95d127b-251d-470a-a062-fa1922dfa9a8",
			"MicroBit PIN Data": "e95d8d00-251d-470a-a062-fa1922dfa9a8", // e95d8d00251d470aa062fa1922dfa9a8
			"MicroBit PIN AD Configuration": "e95d5899-251d-470a-a062-fa1922dfa9a8", // e95d5899251d470aa062fa1922dfa9a8
			"MicroBit PIN IO Configuration": "e95db9fe-251d-470a-a062-fa1922dfa9a8", // e95db9fe251d470aa062fa1922dfa9a8
			"MicroBit PWM Control": "e95dd822-251d-470a-a062-fa1922dfa9a8", // e95dd822251d470aa062fa1922dfa9a8
			
			"MicroBit LED Service": "e95dd91d-251d-470a-a062-fa1922dfa9a8", 
			"MicroBit LED Matrix state": "e95d7b77-251d-470a-a062-fa1922dfa9a8",
			"MicroBit LED Text": "e95d93ee-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Scrolling Delay": "e95d0d2d-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit Event Service": "e95d93af-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Requirements" : "e95db84c-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Event Data": "e95d9775-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Client Requirements": "e95d23c4-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Client Events": "e95d5404-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit DFU Control Service": "e95d93b0-251d-470a-a062-fa1922dfa9a8",
			"MicroBit DFU Control": "e95d93b1-251d-470a-a062-fa1922dfa9a8",
			
			"MicroBit Temperature Service": "e95d6100-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Temperature Data": "e95d9250-251d-470a-a062-fa1922dfa9a8",
			"MicroBit Temperature Period": "e95d1b25-251d-470a-a062-fa1922dfa9a8",
			/* Nordic UART Port Emulation */
			"Nordic UART Service": "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
			"Nordic UART TX": "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
			"Nordic UART RX": "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
		}
		
		async function connect(){
			var dt = new Date();
			console.log("mbBLE connect");
			function pinCallBack(){
				console.log("called pinCallBack",this);
			}
			/**
			function uartCallBack(e){
				console.log("called uartCallBack",this);
				var str_arr=[];
				for(var i=0;i<this.value.byteLength;i++){
					str_arr[i]=this.value.getUint8(i);
				}
				var str= String.fromCharCode.apply(null,str_arr);
				console.log("uartCallBack:",str);
			}
			**/
			var uartCallBackObj={
				uartCallBack:null,
				sending:false,
				mbCmdReturnValue:[],
				conn:false
			}
			async function onCharacteristicValueChanged(e) {
				// console.log("onCharacteristicValueChanged: DT:",dt,this.value);
				var str_arr=[];
				if ( this.value && this.value.byteLength){
					for(var i=0;i<this.value.byteLength;i++){
						str_arr[i]=this.value.getUint8(i);
					}
					var str= String.fromCharCode.apply(null,str_arr);
					console.log("btStr:",str);
					uartCallBackObj.mbCmdReturnValue.push(str);
					if ( str.startsWith("END")){
						uartCallBackObj.sending = false;
						uartCallBackObj.uartCallBack(uartCallBackObj.mbCmdReturnValue);
						uartCallBackObj.mbCmdReturnValue = [];
					} else {
				//		uartCallBackObj.mbCmdReturnValue.push(str);
					}
				}
			}
			
//			onCharacteristicValueChanged(null);
			
			var mbBLE = await connectMicroBit(pinCallBack, onCharacteristicValueChanged);
			console.log("connected MicroBit mbBLE:",mbBLE);
			var mbBleDevice = mbBLE.device;
			// var mbBlePin ...... // for WebGPIO and switches? err020....
			
			// for WebI2C and embedded sendors,LEDs
			var mbBleUartTx = mbBLE.characteristics[0];
			var mbBleUartRx = mbBLE.characteristics[1];
			
			var mbBleUart = getMbUartService(mbBleDevice,uartCallBackObj,mbBleUartRx);
			mbBleDevice.addEventListener('gattserverdisconnected', onDisconnected);
			var conn=true;
			uartCallBackObj.conn = conn;
			console.log("uartCallBackObj:",uartCallBackObj);
			
			async function readSensor(){
				return await readSensorInt(mbBleUart);
			}
			
			async function printLED(ptext){
				return await printLedInt(mbBleUart, ptext);
			}
			
			var requestI2CAccess = requestI2CAccessGenerator(mbBleUart);
			var requestGPIOAccess = requestGPIOAccessGenerator(mbBleUart);
			
			async function onDisconnected(){
				mbBleDevice.removeEventListener('gattserverdisconnected', onDisconnected);
				conn=false;
				navigator.requestI2CAccess = null;
				console.log("DISCONNECTED", dt);
				uartCallBackObj.conn = conn;
				console.log("mbBLE:",mbBLE);
				var charas=mbBLE.characteristics;
				for ( var i = 0 ; i < charas.length ; i++){
//					await charas[i].stopNotifications(); // 強制切断時・・多分これができれば良いはずだが、きれているのでもうできない・・　一度繋げて、再度切断すればうまくいくようですが・・
				}
				console.log("DISCONNECTED", dt);
			}
			
			async function disconnect() {
				console.log("mbBLE:",mbBLE);
				conn=false;
				navigator.requestI2CAccess = null;
				uartCallBackObj.conn = conn;
				if (mbBleDevice && mbBleDevice.gatt.connected){
					var charas=mbBLE.characteristics;
					for ( var i = 0 ; i < charas.length ; i++){
						try{
							await charas[i].stopNotifications(); // これを動かさないと、いつまでもイベントリスナが残ったままになってしまう挙動
						} catch(e){
							console.log("Fail..");
						}
					}
					
					await mbBleDevice.gatt.disconnect();
				}
			}
			
			if ( !navigator.requestI2CAccess){
				console.log("set navigator.requestI2CAccess");
				navigator.requestI2CAccess = requestI2CAccess;
			}
			if ( !navigator.requestGPIOAccess){
				console.log("set navigator.requestGPIOAccess");
				navigator.requestGPIOAccess = requestGPIOAccess;
			}
			
			return {
				get connected(){ return conn },
				disconnect: disconnect,
				// reConnect: reConnect,
				requestI2CAccess : requestI2CAccess,
				requestGPIOAccess : requestGPIOAccess,
				readSensor: readSensor,
				printLED: printLED,
			}
		}
		
		async function connectMicroBit(pinGate,uartTxGate){
			var characteristicSet = [];
			// Pin Services Characteristics[0:UART_TX,1:UART_RX,2:data,3:ADconf,4:IOconf,5:PWMconf]
			
			characteristicSet.push({
				serviceUUID:microBitUUIDs["Nordic UART Service"],
				dataUUID:microBitUUIDs["Nordic UART TX"],
				callback:uartTxGate
			});
			characteristicSet.push({
				serviceUUID:microBitUUIDs["Nordic UART Service"],
				dataUUID:microBitUUIDs["Nordic UART RX"],
			});
			/**
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit IO PIN Service"],
				dataUUID:microBitUUIDs["MicroBit PIN Data"],
				callback:pinGate
			});
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit IO PIN Service"],
				dataUUID:microBitUUIDs["MicroBit PIN AD Configuration"],
			});
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit IO PIN Service"],
				dataUUID:microBitUUIDs["MicroBit PIN IO Configuration"],
			});
			characteristicSet.push({
				serviceUUID:microBitUUIDs["MicroBit IO PIN Service"],
				dataUUID:microBitUUIDs["MicroBit PWM Control"],
			});
			**/
			var mbBLE = await connectBLE(characteristicSet);
			return (mbBLE);
		}
		
		async function connectBLE(characteristicSet ) {
			// characteristicSet = [{serviceUUID:serviceUUID, dataUUID:dataUUID, callBack:callBackFunc},...]
			// というデータ構造を作って、投入する。
			// 生成された.deviceおよび、上記に対応するcharacteristicが入った.characteristics配列が、返却される
			
			// If requestDevice() is called without HM interaction (input button event etc) then throw exception 
			// If you already get device then set device option , for bypassing requestDevice()
			
			var optionalServicesArray = [];
			for ( var i = 0 ; i < characteristicSet.length ; i++ ){
				optionalServicesArray.push(characteristicSet[i].serviceUUID);
			}
			try{
				var device = await navigator.bluetooth.requestDevice({
					filters: [{
						namePrefix: 'BBC micro:bit',
					}],
					optionalServices: optionalServicesArray // Trap!!!: This option is mandatory
				});
				
				if ( device.gatt.connected ){
					console.log("Already connected");
					return ( false );
				}
				var server = await (async function(device){
					return device.gatt.connect();
				})(device);
				console.log("Get micro:bit server : ", server)
				
				var characteristics = [];
				
				for ( var i = 0 ; i < characteristicSet.length ; i++ ){
					var service = await (async function(server){
						return server.getPrimaryService(characteristicSet[i].serviceUUID);
					})(server);
					// console.log("service No:",i," : ", service)
					
					var chara =  await (async function(service){
						return service.getCharacteristic(characteristicSet[i].dataUUID);
					})(service);
					// console.log("chara:", chara)
					
					await (async function(chara){
						//    alert("BLE接続が完了しました。");
//						console.log("callBack?:",characteristicSet[i].callback, characteristicSet[i]);
						if ( characteristicSet[i].callback ){
//							chara.stopNotifications();
//							console.log("SET CALLBACK : : : ",characteristicSet[i].callback, await characteristicSet[i].callback(null) );
							chara.startNotifications();
							chara.addEventListener('characteristicvaluechanged',characteristicSet[i].callback);  
//							chara.oncharacteristicvaluechanged =characteristicSet[i].callback;
						} else {
//							console.log("NO CALLBACK, no NOTIFICATION");
//							chara.addEventListener('characteristicvaluechanged',function(ev){console.log("no NOTIF:",ev)});  
						}
					})(chara);
					characteristics.push(chara);
				}
				
				console.log("OK: ",device,characteristics);
				
				return {
					device : device,
					characteristics : characteristics
				};
			} catch(error){
				alert("Connection Failed : ",error);
				console.log(error);
			}
		}
		
		function getMbUartService(mbBleDevice,uartCallBackObj,mbBleUartRx){
			async function sendCmd2MicroBit(sendValue){
				if ( uartCallBackObj.sending ){
					throw Error("Now sending command....");
				}
				uartCallBackObj.sending = true;
				return new Promise( function (resolve){
					sendCmd2MicroBitS2(sendValue, resolve);
				});
			}

			async function sendCmd2MicroBitS2(sendValue, cbFunc){
				if ( uartCallBackObj.conn ){
					console.log("sendVal:",sendValue);
					var blmsg = string_to_buffer(sendValue+"\n");
					uartCallBackObj.mbCmdReturnValue =[];
					uartCallBackObj.uartCallBack = cbFunc;
					await mbBleUartRx.writeValue(blmsg);
					// この後、microBitから返事が返ると、onCharacteristicValueChanged()がn回連続で呼び出され、最後に"END"の値が返ったものが来る
				} else {
					console.log("uartCallBackObj:",uartCallBackObj);
					throw Error("Bluetooth is not connected..");
				}
			}
			
			return {
				sendCmd2MicroBit: sendCmd2MicroBit
			}
		}
		
		
		// webGPIOimpl
		
		var availablePorts 		= [1,1,1,0,0,1,0,0,1,0,0,1,0,1,1,1,1]; // LED matrix ports are unavailable
		var canOutPorts 		= [1,1,1,0,0,0,0,0,1,0,0,0,0,1,1,1,1]; // 
		var canAnalogInPorts	= [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0]; //
		var pullModeEnum = { "none":0,"down":1,"up":2};
		function requestGPIOAccessGenerator(mbBleUart){
			async function requestGPIOAccess(){
				
				var GPIOports = new Map();
				for ( var i = 0 ; i < availablePorts.length ; i++ ){
					GPIOports.set(i,getGPIOPort(mbBleUart,i));
				}
				
				return {
					ports: GPIOports,
					unexportAll: async function(){},
				}
			}
			return requestGPIOAccess;
		}
		
		function getGPIOPort(mbBleUart, portNumb){
			var direction ="";
			var exported = false;
			var pNumber = portNumb;
			var out = true;
			var ain = false;
			
			async function export_port( mode ,pullMode){ // mode: "in", "out", "analogin", "analogout", (TBD"pwmout") case insensitive
				// pullModeは、ポートやモードごとに決め打ちにするのがいいのかもしれません　analoginはnoneでないとうまく動かない
//				console.log("export_port",mode);
				if ( exported ){
					throw Error("Already exported. Use unexport().");
				}
				direction = mode.toLowerCase();
				exported = true;
				switch (direction){
				case "in":
					out = false;
					ain = false;
					break;
				case "out":
					if ( canOutPorts[pNumber] == 0 ){
						throw Error("This port is not supported digital out");
					}
					out = true;
					ain = false;
					break;
				case "analogin":
					if ( canAnalogInPorts[pNumber] == 0 ){
						throw Error("This port is not supported analog in");
					}
					out = false;
					ain = true;
					if (!pullMode ){
						pullMode = "none"; // a-inはこれが必須なので・・・
					}
					break;
				case "analogout":
					if ( canAnalogInPorts[pNumber] == 0 ){
						throw Error("This port is not supported analog out");
					}
					out = true;
					ain = true;
					break;
				case "pwmout":
					throw Error("PWM out is Under development...");
					// TBD
					break;
				default :
					throw Error("NOT SUPPORTED MODE");
					direction = "";
					exported = false;
				}
//				await setPinMode(pNumber, out, ain );  // これはイベントタイプの時に必要なのだろう・・
//				console.log("setPin num,out,ain: ",pNumber, out, ain);
				if ( pullMode){
					var pm = pullModeEnum["none"];
					switch (pullMode){
					case "none":
						pm = pullModeEnum["none"];
						break;
					case "down":
						pm = pullModeEnum["down"];
						break;
					case "up":
						pm = pullModeEnum["up"];
						break;
					default:
						console.log("pull mode none...");
					}
//					console.log("pm:",pm," pullMode:",pullMode);
					var cmd = "P" + zeroPadding(pNumber,2)+zeroPadding(pm,2);
//					console.log("GPIO cmd:",cmd);
					var returnData = await mbBleUart.sendCmd2MicroBit( cmd );
					console.log("GPIO set pullMode[n,d,u]:",pNumber,returnData);
				}
			}
			async function unexport(){
				exported = false;
				direction ="";
			}
			
			async function read(){
				if ( !out ){
					var cmd;
					if ( ain ){
						cmd = "i";
					} else {
						cmd = "I";
					}
					cmd += zeroPadding(pNumber,2);
					var returnData = await mbBleUart.sendCmd2MicroBit( cmd );
					console.log("GPIO read:",pNumber,returnData);
					var ans = Number(returnData[0].split(",")[1]);
					return ( ans );
				} else {
					throw Error("Can't read. This port's mode is " + direction);
				}
			}
			
			async function write(value){ // uint8
//				console.log("write",value);
				if ( out ){
					var cmd;
					value = Math.floor(value);
					if ( value < 0 ){
						value = 0;
					}
					if ( ain ){
						cmd = "o";
						if (value > 1023 ){
							value = 1023;
						}
					} else {
						if (value > 1 ){
							value = 1;
						}
						cmd = "O";
					}
					cmd += zeroPadding(pNumber,2)+zeroPadding(value,4);
					var returnData = await mbBleUart.sendCmd2MicroBit( cmd );
					console.log("GPIO write:",pNumber,returnData);
					return ( true );
				} else {
					throw Error("Can't write. This port's mode is " + direction);
				}
			}
			
			var onChangeFunc = null;
			var changeMonitoring = false;
			
			async function changeMonitor(){ // 結局micro:bit側でネイティブのchangeモニタはメモリオーバーフローするのでやめてBT経由でポーリング・・・
				if ( direction.indexOf("in") < 0){
					console.log("onchange should be in mode");
					return;
				}
				if ( changeMonitoring ){
					return;
				}
				changeMonitoring = true;
				var pVal = -1;
				while ( onChangeFunc ){
					var cVal;
					try{
						cVal = await read();
					} catch ( err ){
						console.log( "sending... skip");
						cVal = pVal;
					}
					if (pVal != cVal ){
						console.log("Value Changed:",cVal);
						onChangeFunc(cVal);
					}
					pVal = cVal;
					await sleep(pollingInterval);
				}
				changeMonitoring = false;
			}
			
			
			/** 下記返り値:これにしたほうがいい?
			var obj = {}; 
			Object.defineProperty(obj, "prop", { 
				value: "test", 
				writable: false 
			}); 
			**/
			return {
				// read only props
				get portNumber(){ return portNumb},
				get portName(){ return String(portNumb)},
				get pinName(){ return String(portNumb)},
				get direction(){ return direction },
				get exported(){ return exported},
				export : export_port,
				unexport: unexport,
				read: read,
				write: write,
				// setter props
				set onchange(value){
//					console.log("called setter: onchange:",value);
					onChangeFunc = value;
					changeMonitor();
				},
				get OnChangeFunc(){ return  onChangeFunc},
			}
		}
		
		
		
		// webI2C impl
		
		function requestI2CAccessGenerator(mbBleUart){
			async function requestI2CAccess(){
				
				var I2Cports = new Map();
				I2Cports.set(1,getI2CPort(mbBleUart)); // ポートは1番、1個しかない
				
				return {
					ports: I2Cports,
					unexportAll: async function(){},
				}
			}
			return requestI2CAccess;
		}
		
		function getI2CPort(mbBleUart){
			async function open(slaveAddress){
				var slaveDevice = await getSlaveDevice(mbBleUart, slaveAddress);
				console.log("slaveDevice:",slaveDevice, "  addr:",slaveAddress);
				return slaveDevice;
			}
			return{
				open: open,
			}
		}
		
		async function getSlaveDevice(mbBleUart, slaveAddress){
			console.log("called open -> getSlaveDevice");
			async function read8(register){
				var cmd = "R" + toHex2(slaveAddress)+ toHex2(2) + toHex2(register)+ toHex2(1);
				var returnData = await mbBleUart.sendCmd2MicroBit( cmd );
				console.log("i2c read8: ",returnData);
				if ( returnData[0].startsWith("END:R")){
					var ans = parseInt(returnData[0].substring(5),16);
//					var ans = Number((returnData[0].substring(2)).split(",")[2]);
					console.log("(16):",ans.toString(16));
					return ( ans );
				} else {
					throw Error("Read failed..");
				}
			}
			async function write8(register,val){
				var cmd = "W" + toHex2(slaveAddress) + toHex2(2) + toHex2(register) + toHex2(val);
				var returnData = await mbBleUart.sendCmd2MicroBit( cmd );
				console.log("i2c write8:",returnData);
			}
			async function read16(register){
				var cmd = "R" + toHex2(slaveAddress)+ toHex2(2) + toHex2(register)+ toHex2(2);
				var returnData = await mbBleUart.sendCmd2MicroBit( cmd );
				console.log("i2c read16:",returnData);
				if ( returnData[0].startsWith("END:R")){
//					var ans = parseInt(returnData[0].substring(5),16);
					var ans = parseInt(returnData[0].substr(7,2)+returnData[0].substr(5,2),16);
//					var ans = Number((returnData[0].substring(2)).split(",")[2]);
					console.log("(16):",ans.toString(16));
					return ( ans );
				} else {
					throw Error("Read failed..");
				}
			}
			async function write16(register,val){
				var cmd = "w" + slaveAddress + "," + register + "," + val;
				var returnData = await mbBleUart.sendCmd2MicroBit( cmd );
			}
			
			async function writeBytes(bytes){
				var ret;
				var cmd = "W" + toHex2(slaveAddress)+toHex2(bytes.length);
				for ( var i = 0 ; i < bytes.length ; i++ ){
					cmd = cmd + toHex2(bytes[i]);
					if ( cmd.length >18){
						ret = await mbBleUart.sendCmd2MicroBit( cmd );
//						console.log("partRet:",ret);
						cmd ="C";
					}
				}
				if ( cmd.length > 1 ){
					ret = await mbBleUart.sendCmd2MicroBit( cmd );
				}
				console.log("writeBytes:",ret, bytes);
			}
			
			console.log("ret");
			return{
				read8: read8,
				write8: write8,
				read16: read16, // read/write16 is Little Endian
				write16: write16,
				writeBytes: writeBytes
			}
		}
		
		function getRetVal( str ){
			var ans = str.split(":");
			ans = ans[ans.length-1];
			return ( ans );
		}
		
		async function readSensorInt(mbBleUart){
			var ret = await mbBleUart.sendCmd2MicroBit("S");
			console.log("readSensor:",ret);
			var acc = getRetVal(ret[0]).split(",");
			var mag = getRetVal(ret[1]).split(",");
			var tbr = getRetVal(ret[2]).split(",");
			var btn = Number(getRetVal(ret[3]));
			var ans = {
				acceleration:{
					x: Number(acc[0]),
					y: Number(acc[1]),
					z: Number(acc[2])
				},
				magneticField:{
					x: Number(mag[0]),
					y: Number(mag[1]),
					z: Number(mag[2])
				},
				temperature: Number(tbr[0]),
				brightness: Number(tbr[1]),
				button: btn
			}
			return ans;
		}

		async function printLedInt(mbBleUart, ptext){
			console.log("printLED:",ptext);
			var ret = await mbBleUart.sendCmd2MicroBit("L"+ptext);
			console.log("printLED:",ret);
			return ret;
		}

		function string_to_buffer(src) {
		  return (new Uint8Array([].map.call(src, function(c) {
		    return c.charCodeAt(0)
		  }))).buffer;
		}
		
		function toHex2(numb){//2桁
			ret = ( '00' + numb.toString(16) ).slice( -2 ).toUpperCase();
			return ( ret );
		}
		return {
			connect: connect, // これでmicroBitBLEインスタンスが獲得できる
		}
	})();
	
	function zeroPadding(num,length){
	    return ('0000000000' + num).slice(-length);
	}
	
	function sleep(ms) {
		return new Promise(function(resolve) {
			setTimeout(resolve, ms);
		});
	}
	
	window.microBitBleFactory = microBitBleFactory;
	window.sleep = sleep;
	/**
	if ( !navigator.requestGPIOAccess){
		navigator.requestGPIOAccess = microBitBLE.requestGPIOAccess;
	}
	**/
})( window );

