'use strict';
import { SubscriberFactory } from './subscriptions/SubscriberFactory';

class CloudwatchLogsSubscribe {
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
          stream: {
            usage:
            'Specify a kinesis stream name to deploy '
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
      'subscribe:deploy': this.addSubscriptions.bind(this),
      'after:subscribe:deploy': this.afterSubscribe.bind(this),
    };
  }

  beforePlugginInit() {
    this.serverless.cli.log('initialising the subscription process!');
  }
  displaySubscriptionVariables() {
      this.serverless.cli.log(`Region set to ${this.options.region}`);
      this.serverless.cli.log(`Kinesis Stream Name set to ${this.options.stream}`);
      this.serverless.cli.log(`Log Group Name Prefix set to ${this.options.logGroup}`);
  }
  addSubscriptions() {
      const subscriber = new SubscriberFactory({
          region: this.options.region,
          streamName: this.options.stream,
          logGroupNamePrefix: this.options.logGroup,
      });
      this.serverless.cli.log(subscriber.subscribe());
  }
  afterSubscribe() {
      this.serverless.cli.log('Cloudwatch Log Group Subscriptions setup Successful.');
  }
}

module.exports = CloudwatchLogsSubscribe;
