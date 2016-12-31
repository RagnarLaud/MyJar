import {describe, it, before, after} from 'mocha';
import {expect} from 'chai';
import {fs} from 'mz';

import EncryptionHandler from '../modules/encryption';

describe('Encryption tests', () => {

    describe('using a passphrase', () => {
        let encryption = null;
        let stages     = {
            raw: 'keyboard cat',
            enc: null,
            dec: null
        };
        let passphrase = 'secret passphrase';

        before(async() => {
            encryption = new EncryptionHandler();
            await encryption.initialize({passphrase});
        });

        it(`should encrypt "${stages.raw}" using the passphrase "${passphrase}"`,
            async() => {
                stages.enc = await encryption.encrypt(stages.raw, 'base64');
                expect(stages.enc).to.be.a('string');
            });

        it(`should decrypt the data using the passphrase "${passphrase}"`,
            async() => {
                stages.dec = await encryption.decrypt(stages.enc, 'base64');
                expect(stages.dec).to.be.a('string');
            });

        it(`the encrypted data should match the raw data`,
            async() => expect(stages.dec).to.equal(stages.raw));
    });

    describe('using a passphrase file', () => {
        let encryption     = null;
        let stages         = {
            raw: 'keyboard cat',
            enc: null,
            dec: null
        };
        let passphrasePath = __dirname+'/passphrase.txt';

        before(async() => {
            encryption = new EncryptionHandler();
            await encryption.initialize({passphrasePath});
        });

        after(async() => await fs.unlink(passphrasePath));

        it(`should encrypt "${stages.raw}" using the passphrase file`,
            async() => {
                stages.enc = await encryption.encrypt(stages.raw, 'base64');
                expect(stages.enc).to.be.a('string');
            });

        it(`should decrypt the data using the passphrase file`,
            async() => {
                stages.dec = await encryption.decrypt(stages.enc, 'base64');
                expect(stages.dec).to.be.a('string');
            });

        it(`the encrypted data should match the raw data`,
            async() => expect(stages.dec).to.equal(stages.raw));
    })
});