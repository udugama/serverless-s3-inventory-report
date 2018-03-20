'use strict';
import * as BP from 'bluebird'; 
import { SubscriberFactory } from './subscriptions/SubscriberFactory';
import { ReportConfigurator } from './inventory/ReportConfigurator';

class S3InventoryReportPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      s3inventoryReport: {
        usage: 'Create S3 Inventory Report on bucket',
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
        },
      },
    };

    this.hooks = {
      'before:s3inventoryReport:init': this.beforePlugginInit.bind(this),
      's3inventoryReport:init': this.displaySubscriptionVariables.bind(this),
      's3inventoryReport:deploy': BP.promisifyAll(this.addSubscriptions).bind(this),
      'after:s3inventoryReport:deploy': this.afterSubscribe.bind(this),
    };
  }

  beforePlugginInit() {
    this.serverless.cli.log('Initialising the S3 Inventory Report plugin...');
  }
  displaySubscriptionVariables() {
      this.serverless.cli.log(`Serverless Region: ${this.options.region}`);
  }
  async addSubscriptions() {
    const subscriber = new ReportConfigurator({ region: this.options.region, serverless: this.serverless });
    await subscriber.configure();
  }
  afterSubscribe() {
    this.serverless.cli.log('S3 Inventory Report Creation Successful.');
  }
}

module.exports = S3InventoryReportPlugin;
 