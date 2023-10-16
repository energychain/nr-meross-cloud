module.exports = function(RED) {
    function Reader(config) {
        const MerossCloud = require('meross-cloud');
        RED.nodes.createNode(this,config);

        const options = {
            email: config.username,
            password: config.password,
            logger: ()=> {},
            localHttpFirst: false, 
            onlyLocalForGet: false, 
            timeout: 25000 
        };
        const node = this;
        let initialized = false;
        let device = null;

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

        meross.on('deviceInitialized', (deviceId, deviceDef, mdevice) => {
            node.status({ fill: "red", shape: "dot", text: "connecting"});
            mdevice.on('connected', () => {
                node.status({ fill: "yellow", shape: "dot", text: "connecting"});
                initialized = true;
                device = mdevice;
             });    
        });
        
       
        node.on('input', async function(msg) {
            while(!initialized) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            try {
                device.controlToggleX(config.channel, msg.payload, (err, res) => {   
                    node.send({
                        payload:res
                    });
                });
            }
           catch(e) {
                node.status({ fill: "red", shape: "dot", text: "API Error"});
                console.log(e);
           }
        });
    }
    RED.nodes.registerType("MerossEnergy",Reader);
}
