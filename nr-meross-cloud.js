module.exports = function(RED) {
    function Reader(config) {
        const MerossCloud = require('meross-cloud');
        RED.nodes.createNode(this,config);

        const options = {
            email: config.username,
            password: config.password,
            logger: ()=> {},
            localHttpFirst: true, 
            onlyLocalForGet: true, 
            timeout: 15000 
        };
        const node = this;

        const meross = new MerossCloud(options);
        console.log("Finished Setup Meross");

        meross.on('connected', (deviceId) => {
            console.log(deviceId + ' connected');
        });
        
        meross.on('close', (deviceId, error) => {
            console.log(deviceId + ' closed: ' + error);
        });
        
        meross.on('error', (deviceId, error) => {
            console.log(deviceId + ' error: ' + error);
        });
        
        meross.on('reconnect', (deviceId) => {
            console.log(deviceId + ' reconnected');
        });
        
        meross.on('data', (deviceId, payload) => {
            console.log(deviceId + ' data: ' + JSON.stringify(payload));
        });
        
        meross.connect((error) => {
            console.log('connect error: ' + error);
        });

        meross.on('deviceInitialized', (deviceId, deviceDef, device) => {
            node.status({ fill: "red", shape: "dot", text: "connecting"});
            device.on('connected', () => {
                node.status({ fill: "yellow", shape: "dot", text: "connecting"});
                setInterval(function() {
                   
                        device.getControlElectricity((err, res) => {
                            try {
                                if(typeof res !== 'undefined') {
                                    res.electricity.device = deviceDef;
            
                                    node.send({
                                        topic:deviceId,
                                        payload:res.electricity
                                    });
                                    
                                    node.status({ fill: "green", shape: "dot", text: ""+(res.electricity.current/10)+"W "+(res.electricity.voltage/10)+"V"});
                                } else 
                                if(err) {
                                    throw "API Error"+err;
                                }
                            } catch(e) {
                                node.status({ fill: "red", shape: "dot", text: "Exception:"+e});
                            }
                        });
                   
                },15000);
                
             });    
        });
        
       /*
        node.on('input', async function(msg) {
            try {
                
                node.send(msg);
                node.status({ fill: "green", shape: "dot", text: "Local:"+latest.localprice+" / National:"+latest.marketprice});
            }
           catch(e) {
                node.status({ fill: "red", shape: "dot", text: "Unable to retrieve from API"});
                console.log(e);
           }
        });
        */
    }
    RED.nodes.registerType("MerossEnergy",Reader);
}
