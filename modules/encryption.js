import {createCipher, createDecipher, randomBytes} from 'crypto';
import {fs} from 'mz';
import path from 'path';

/**
 * Encryption handler constructor function
 * @param passphrasePath The passphrase file path.
 * @param passphrase The passphrase. This outweights the passphrase file.
 * @constructor
 */
export default function EncryptionHandler(){

	this.algorithm = 'aes192';
	this.passphrase = null;

    /**
     * Gets everything set up.
     * If a passphrase is not given, the passphrase path will be used.
     * If the passphrase path does not resolve to a file, a file will
     * be generated. If neither a passphrase nor a path are given,
     * the passphrase will be created in the parent directory.
     */
	this.initialize = async ({passphrasePath, passphrase}) => {
		if(passphrase){
			this.passphrase = passphrase;
		}else if(passphrasePath || this.passphrasePath){
			if(true !== await fs.exists(passphrasePath || this.passphrasePath)){
                let buf = randomBytes(10 * 1024).toString('hex');
                await fs.writeFile(passphrasePath || this.passphrasePath, buf);
			}

            this.passphrase = await fs.readFile(passphrasePath || this.passphrasePath);
		}else{
		    this.passphrasePath = path.resolve(__dirname, '..', 'passphrase');
		    return this.initialize({passphrasePath, passphrase});
        }
	};

	this.encrypt = (data, format = 'hex') => {
		let cipher = createCipher(this.algorithm, this.passphrase);
		return cipher.update(data, 'utf-8', format) + cipher.final(format);
	};

	this.decrypt = (data, format = 'hex') => {
		let decipher = createDecipher(this.algorithm, this.passphrase);
		return decipher.update(data, format, 'utf-8') + decipher.final('utf-8');
	};

	this.middleware = (req, res, next) => (req.encryption = this) && next();

}