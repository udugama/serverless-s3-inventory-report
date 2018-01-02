'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const SubscriberFactory_1 = require("./subscriptions/SubscriberFactory");
class ServerlessPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.commands = {
            welcome: {
                usage: 'Helps you start your first Serverless plugin',
                lifecycleEvents: [
                    'hello',
                    'world',
                ],
                options: {
                    region: {
                        usage: 'Specify the aws region to deploy '
                            + '--region',
                        required: true,
                        shortcut: 'r',
                    },
                    stream: {
                        usage: 'Specify a kinesis stream name to deploy '
                            + '--stream',
                        required: true,
                        shortcut: 's',
                    },
                    logGroup: {
                        usage: 'Specify a log group prefix to add the subscription '
                            + '--logGroup',
                        required: false,
                        shortcut: 'l',
                    },
                },
            },
        };
        this.hooks = {
            'before:welcome:hello': this.beforeWelcome.bind(this),
            'welcome:hello': this.welcomeUser.bind(this),
            'welcome:world': this.displayHelloMessage.bind(this),
            'after:welcome:world': this.afterHelloWorld.bind(this),
        };
    }
    beforeWelcome() {
        this.serverless.cli.log('initialising the subscription process!');
    }
    welcomeUser() {
        const subscriber = new SubscriberFactory_1.SubscriberFactory({
            region: this.options.region,
            streamName: this.options.stream,
            logGroupNamePrefix: this.options.logGroup,
        });
        this.serverless.cli.log(subscriber.subscribe());
    }
    displayHelloMessage() {
        this.serverless.cli.log(`Region set to ${this.options.region}`);
        this.serverless.cli.log(`Kinesis Stream Name set to ${this.options.stream}`);
        this.serverless.cli.log(`Log Group Name Prefix set to ${this.options.logGroup}`);
    }
    afterHelloWorld() {
        this.serverless.cli.log('Please come again!');
    }
}
module.exports = ServerlessPlugin;
