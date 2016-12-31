# Installation guide

### Software dependencies
    Node.js 7.1.0 or newer (https://nodejs.org/en/download/current)
    MongoDB 3.2.11 or newer (https://www.mongodb.com/download-center)

### Installation
    Open up a command line interface
    Navigate to the directory where you want to install the application
    Run `git clone https://github.com/RagnarLaud/MyJar ./MyJar`
    Install the required software (requirements above)
    Register an account on Twilio.com to receive the Twilio API SID and Auth Token
    Run `npm install`
    Run `npm run setup`
    Start MongoDB
    Open config.json
    Insert the Twilio API SID and Auth Token into the twilio property
    Insert the MongoDB information into the database property
        Node:   If you have not created an account for MongoDB,
                you can leave the username and password fields empty
    Run `npm start`