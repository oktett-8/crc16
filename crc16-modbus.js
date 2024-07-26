module.exports = function(RED) {

    var crcinputcrc16modbus;
    var inputType = "HEX";
    var CRCMaster = {
        StringToCheck: "",
        CleanedString: "",
        CRCTableDNP: [],
        init: function() {
            this.CRCDNPInit();
        },
        CleanString: function(inputType) {
            if (inputType == "ASCII") {
                this.CleanedString = this.StringToCheck;
            } else {
                if (this.StringToCheck.match(/^[0-9A-F \t]+$/gi) !== null) {
                    this.CleanedString = this._hexStringToString(this.StringToCheck.toUpperCase().replace(/[\t ]/g, ''));
                } else {
                    window.alert("String doesn't seem to be a valid Hex input.");
                    return false;
                }
            }
            return true;
        },
        CRCDNPInit: function() {
            var i, j, crc, c;
            for (i = 0; i < 256; i++) {
                crc = 0;
                c = i;
                for (j = 0; j < 8; j++) {
                    if ((crc ^ c) & 0x0001) crc = (crc >> 1) ^ 0xA6BC;
                    else crc = crc >> 1;
                    c = c >> 1;
                }
                this.CRCTableDNP[i] = crc;
            }
        },
        CRC16Modbus: function() {
            var crc = 0xFFFF;
            var str = this.CleanedString;
            for (var pos = 0; pos < str.length; pos++) {
                crc ^= str.charCodeAt(pos);
                for (var i = 8; i !== 0; i--) {
                    if ((crc & 0x0001) !== 0) {
                        crc >>= 1;
                        crc ^= 0xA001;
                    } else
                        crc >>= 1;
                }
            }
            return crc;
        },
        _stringToBytes: function(str) {
            var ch, st, re = [];
            for (var i = 0; i < str.length; i++) {
                ch = str.charCodeAt(i); // get char
                st = []; // set up "stack"
                do {
                    st.push(ch & 0xFF); // push byte to stack
                    ch = ch >> 8; // shift value down by 1 byte
                }
                while (ch);
                // add stack contents to result
                // done because chars have "wrong" endianness
                re = re.concat(st.reverse());
            }
            // return an array of bytes
            return re;
        },
        _hexStringToString: function(inputstr) {
            var hex = inputstr.toString(); //force conversion
            var str = '';
            for (var i = 0; i < hex.length; i += 2)
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            return str;
        },
        Calculate: function(str, inputType) {
            this.StringToCheck = str;
            if (this.CleanString(inputType)) {
                crcinputcrc16modbus=this.CRC16Modbus().toString(16).toUpperCase().padStart(4, "0");
                crcinputcrc16modbus=crcinputcrc16modbus.substr(2) + crcinputcrc16modbus.substr(0, 2); //swap bytes
            }
        }
    };

    CRCMaster.init();
    
    function CRC16(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            CRCMaster.Calculate(msg.payload, inputType);
            msg.payload = msg.payload + crcinputcrc16modbus;
            node.send(msg);
        });
    }
    RED.nodes.registerType("crc16-modbus",CRC16);
}