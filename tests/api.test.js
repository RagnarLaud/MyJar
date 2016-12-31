import Application from '../modules/application';
import {describe, before, after, it} from 'mocha';
import chai, {assert, expect} from 'chai';
import http from 'chai-http';

chai.use(http);

// More output
process.on('unhandledRejection', console.error);

describe('API tests', () => {
    let application;
    let server;

    before(async() => {
        application = new Application();
        await application.start();
        server = chai.request.agent(application.express);
    });
    after(async() => {
        await application.close();
    });

    describe('Response test', () => {
        const validData    = {
            email: "example@example.org",
            mobile: "+44 20 7946 0939",
            field: "value"
        };
        const globalClient = {};
        const client       = {};

        before(async() => {
            let {body, status} = await server.put('/client').send(validData)
                .catch(r => r.response);

            expect(status).to.equal(201);
            expect(body).to.be.an('object');

            expect(body).to.have.property('id');
            expect(body).to.have.property('email');
            expect(body).to.have.property('mobile');
            expect(body).to.have.property('field');

            expect(body.id).to.be.a('string');
            expect(body.email).to.be.a('string');
            expect(body.mobile).to.be.a('string');
            expect(body.field).to.be.a('string');

            for (let property in body) {
                if (body.hasOwnProperty(property))
                    globalClient[property] = body[property];
            }
        });
        after(async() => {
            let {body, status} = await server.delete('/client/' + globalClient.id);

            expect(status).to.equal(200);
            expect(body).to.be.an('object');
        });

        describe('GET /clients', () => {
            it('should return an array when not passing in any parameters', async() => {
                let {body, status} = await server.get('/clients').catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('array');
                expect(body).to.contain(globalClient);
            });

            it('should return an array when passing in a field query', async() => {
                let fields = Object.keys(globalClient);

                for (let field of fields) {
                    if (field === 'mobile') continue;

                    let value          = globalClient[field];
                    let {body, status} = await server.get(`/clients/?f:${field}=${value}`)
                        .catch(r => r.response);

                    expect(status).to.equal(200);
                    expect(body).to.be.an('array');
                    expect(body).to.contain(globalClient);
                }
            });

            it('should return an array when passing in the page', async() => {
                let {body, status} = await server.get('/clients/?page=1')
                    .catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('array');
                expect(body).to.contain(globalClient);
            });

            it('should return an array when passing in the page size', async() => {
                let {body, status} = await server.get('/clients/?pageSize=1')
                    .catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('array');
                expect(body).to.contain(globalClient);
            });

            it('should respond with 400 when passing invalid page parameter', async() => {
                let {body, status} = await server.get('/clients/?page=invalid')
                    .catch(r => r.response);

                expect(status).to.equal(400);
                expect(body).to.be.an('array');
                expect(body).not.to.contain(globalClient);
            });

            it('should respond with 400 when passing invalid page size parameter', async() => {
                let {body, status} = await server.get('/clients/?pageSize=invalid')
                    .catch(r => r.response);

                expect(status).to.equal(400);
                expect(body).to.be.an('array');
                expect(body).not.to.contain(globalClient);
            });
        });
        describe('GET /client/:id', () => {
            it('should return a client object identical to the one we have', async() => {
                let {body, status} = await server.get(`/client/${globalClient.id}`)
                    .catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('object');
                expect(body).to.deep.equal(globalClient);
            });

            it('should return with a 404 when retrieving an invalid user', async() => {
                let {body, status} = await server.get('/client/invalidClientId')
                    .catch(r => r.response);

                expect(status).to.equal(404);
                expect(body).to.be.an('object');
                expect(body).not.to.deep.equal(globalClient);
            });
        });
        describe('PUT /client', () => {
            it('should successfully create a client', async() => {
                let {body, status} = await server.put('/client').send(validData)
                    .catch(r => r.response);

                expect(status).to.equal(201);
                expect(body).to.be.an('object');

                expect(body).to.have.property('id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('mobile');
                expect(body).to.have.property('field');

                expect(body.id).to.be.a('string');
                expect(body.email).to.be.a('string');
                expect(body.mobile).to.be.a('string');
                expect(body.field).to.be.a('string');

                for (let property in body) {
                    if (body.hasOwnProperty(property))
                        client[property] = body[property];
                }
            });
            it('should respond with a 406 when sending invalid fields', async() => {
                let {body, status} = await server.put('/client').send({
                    email: 'invalid email',
                    mobile: validData.mobile,
                    field: validData.field
                }).catch(r => r.response);

                expect(status).to.equal(406);
                expect(body).to.be.an('array');

                expect(body).to.contain('email');
                expect(body).not.to.contain('mobile');
                expect(body).not.to.contain('field');
            });
            it('should respond with a 406 when sending invalid fields', async() => {
                let {body, status} = await server.put('/client').send({
                    email: validData.email,
                    mobile: 'invalid mobile',
                    field: validData.field
                }).catch(r => r.response);

                expect(status).to.equal(406);
                expect(body).to.be.an('array');

                expect(body).not.to.contain('email');
                expect(body).to.contain('mobile');
                expect(body).not.to.contain('field');
            });
            it('should respond with a 406 when sending invalid fields', async() => {
                let {body, status} = await server.put('/client').send({
                    email: validData.email,
                    mobile: validData.mobile,
                    field: {invalid: 'field'}
                }).catch(r => r.response);

                expect(status).to.equal(406);
                expect(body).to.be.an('array');

                expect(body).not.to.contain('email');
                expect(body).not.to.contain('mobile');
                expect(body).to.contain('field');
            });
            it('should respond with a 400 when not sending a required field', async() => {
                let {body, status} = await server.put('/client').send({
                    mobile: validData.mobile
                }).catch(r => r.response);

                expect(status).to.equal(400);
                expect(body).to.be.an('array');

                expect(body).to.contain('email');
                expect(body).not.to.contain('mobile');
            });
            it('should respond with a 400 when not sending a required field', async() => {
                let {body, status} = await server.put('/client').send({
                    email: validData.email
                }).catch(r => r.response);

                expect(status).to.equal(400);
                expect(body).to.be.an('array');

                expect(body).not.to.contain('email');
                expect(body).to.contain('mobile');
            });
        });
        describe('PUT /client/:id', () => {
            it('should successfully modify the client', async() => {
                let {body, status} = await server.put(`/client/${globalClient.id}`).send({
                    email: 'modified@example.com',
                    mobile: '+44 20 7946 9390'
                }).catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('object');

            });
            it('should respond with a 404 when specifying an invalid ID', async() => {
                let {body, status} = await server.put(`/client/invalidClientId`)
                    .catch(r => r.response);

                expect(status).to.equal(404);
                expect(body).to.be.an('object');

            });
            it('should respond with a 406 when sending invalid fields', async() => {
                let {body, status} = await server.put(`/client/${globalClient.id}`).send({
                    email: 'invalid email'
                }).catch(r => r.response);

                expect(status).to.equal(406);
                expect(body).to.be.an('array');
                expect(body).to.contain('email');
                expect(body).not.to.contain('mobile');
                expect(body).not.to.contain('field');
            });
            it('should respond with a 406 when sending invalid fields', async() => {
                let {body, status} = await server.put(`/client/${globalClient.id}`).send({
                    mobile: 'invalid mobile'
                }).catch(r => r.response);

                expect(status).to.equal(406);
                expect(body).to.be.an('array');
                expect(body).not.to.contain('email');
                expect(body).to.contain('mobile');
                expect(body).not.to.contain('field');
            });
            it('should respond with a 406 when sending invalid fields', async() => {
                let {body, status} = await server.put(`/client/${globalClient.id}`).send({
                    field: {invalid: 'field'}
                }).catch(r => r.response);

                expect(status).to.equal(406);
                expect(body).to.be.an('array');
                expect(body).not.to.contain('email');
                expect(body).not.to.contain('mobile');
                expect(body).to.contain('field');
            });
        });
        describe('DELETE /client/:id', () => {
            it('should successfully delete the client', async () => {
                let {body, status} = await server.delete(`/client/${client.id}`)
                    .catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('object');
            });
            it('should respond with a 404 when deleting an invalid client', async () => {
                let {body, status} = await server.delete(`/client/invalidClientId`)
                    .catch(r => r.response);

                expect(status).to.equal(404);
                expect(body).to.be.an('object');
            });
        });
    });
    describe('End-to-end test', () => {
        let client    = {
            email: "example@example.org",
            mobile: "+44 20 7946 0939",
            arbitraryName: "arbitraryValue"
        };
        let clientMod = {
            email: "example.modified@example.com",
            mobile: "+44 20 7946 9390"
        };

        let dataStore = {
            client_id: ''
        };

        it('should create a new client',
            async() => {
                let {body, status} =
                        await server
                            .put('/client')
                            .send(client)
                            .catch(r => r.response);

                expect(status).to.equal(201);
                expect(body).to.be.an('object');
                expect(body).to.have.property('id');

                dataStore.client_object = body;
            });

        it('should verify the existence of the client',
            async() => {
                let {body, status} =
                        await server
                            .get(`/client/${dataStore.client_object.id}`)
                            .catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('object');
                expect(body).to.have.property('id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('mobile');
            });

        it('should be responded to with a 406 when trying to set the email or phone number to an invalid value',
            async() => {
                let {body, status} =
                        await server
                            .put(`/client/${dataStore.client_object.id}`)
                            .send({
                                email: "invalid email address",
                                mobile: "invalid mobile number"
                            })
                            .catch(r => r.response);

                expect(status).to.equal(406);
                expect(body).to.be.an('array');
                expect(body).to.contain('email');
                expect(body).to.contain('mobile');
            });

        it('should modify the previously created client',
            async() => {
                let {body, status} =
                        await server
                            .put(`/client/${dataStore.client_object.id}`)
                            .send(clientMod)
                            .catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('object');
                expect(body).to.have.property('id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('mobile');
                expect(body).to.have.property('arbitraryName');

                dataStore.client_object = body;
            });

        it('should add a new informational field to the previously created client',
            async() => {
                let {body, status} =
                        await server
                            .put(`/client/${dataStore.client_object.id}`)
                            .send({anotherArbitraryName: 'something'})
                            .catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('object');
                expect(body).to.have.property('id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('mobile');
                expect(body).to.have.property('anotherArbitraryName');
                expect(body.anotherArbitraryName).to.equal('something');

                dataStore.client_object = body;
            });

        it('should remove the previously added informational field from the client',
            async() => {
                let {body, status} =
                        await server
                            .put(`/client/${dataStore.client_object.id}`)
                            .send({anotherArbitraryName: ''})
                            .catch(r => r.response);

                expect(status).to.equal(200);
                expect(body).to.be.an('object');
                expect(body).to.have.property('id');
                expect(body).to.have.property('email');
                expect(body).to.have.property('mobile');
                expect(body).not.to.have.property('anotherArbitraryName');

                dataStore.client_object = body;
            });

        it('should return an array containing the previously created client',
            async() => {
                expect(dataStore.client_object).to.be.an('object');

                let {body, status} =
                        await server
                            .get(`/clients/?f:email=${dataStore.client_object.email}`)
                            .catch(r => r.response);

                expect(status).to.be.equal(200);
                expect(body).to.be.an('array');
                expect(body).to.contain(dataStore.client_object);
            });

        it('should return an array containing the previously created client',
            async() => {
                expect(dataStore.client_object).to.be.an('object');

                let {body, status} =
                        await server
                            .get(`/clients/?f:arbitraryName=${client.arbitraryName}`)
                            .catch(r => r.response);

                expect(status).to.be.equal(200);
                expect(body).to.be.an('array');
                expect(body).to.contain(dataStore.client_object);
            });

        it('should delete the previously created client',
            async() => {
                expect(dataStore.client_id).to.be.an('string');

                let {status} =
                        await server
                            .delete(`/client/${dataStore.client_object.id}`)
                            .catch(r => r.response);

                expect(status).to.equal(200);
            });
    });

});