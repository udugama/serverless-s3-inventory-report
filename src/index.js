'use strict';
import * as BP from 'bluebird'; 
import { SubscriberFactory } from './subscriptions/SubscriberFactory';

class CloudWatchLogSubscriberPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      subscribe: {
        usage: 'Helps you start your first Serverless plugin',
        lifecycleEvents: [
          'init',
          'deploy',
        ],
        options: {
          region: {
            usage:
            'Specify the aws region to deploy '
            + '--region',
            required: true,
            shortcut: 'r',
          },
          type: {
            usage:
            'Specify the supported type of the subscriber resource ( eg: kinesis | firehose | lambda )'
            + '--type',
            required: true,
            shortcut: 't',
          },
          name: {
            usage:
            'Specify a name of the subscriber resource of the given type ( Kinesis name | Kinesis Firehorse name | Lambda function name)'
            + '--stream',
            required: true,
            shortcut: 's',
          },
          logGroup: {
            usage:
            'Specify a log group prefix to add the subscription '
            + '--logGroup',
            required: false,
            shortcut: 'l',
          },
        },
      },
    };

    this.hooks = {
      'before:subscribe:init': this.beforePlugginInit.bind(this),
      'subscribe:init': this.displaySubscriptionVariables.bind(this),
      'subscribe:deploy': BP.promisifyAll(this.addSubscriptions).bind(this),
      'after:subscribe:deploy': this.afterSubscribe.bind(this),
    };
  }

  beforePlugginInit() {
    this.serverless.cli.log('Initialising the Subscription process...');
  }
  displaySubscriptionVariables() {
      this.serverless.cli.log(`Serverless Region: ${this.options.region}`);
      this.serverless.cli.log(`Subscriber Resource type: ${this.options.type}`);
      this.serverless.cli.log(`Subscriber Resource Name: ${this.options.name}`);
      this.serverless.cli.log(`Log Group Name Prefix: ${this.options.logGroup}`);
  }
  async addSubscriptions() {
    const subscriber = new SubscriberFactory({
        region: this.options.region,
        streamName: this.options.name,
        subscriberType: this.options.type,
        logGroupNamePrefix: this.options.logGroup,
    });
    this.serverless.cli.log(await subscriber.subscribe());
  }
  afterSubscribe() {
    this.serverless.cli.log('Cloudwatch Log Group Subscriptions setup Successful.');
  }
}

module.exports = CloudWatchLogSubscriberPlugin;
 