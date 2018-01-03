import { InternalError, NotFoundError, TemandoError } from '@temando/errors';
import { CloudWatchLogs, IAM, Kinesis } from 'aws-sdk';
import { delay, map } from 'bluebird';
import { waitForStack } from './lib/WaitForStack';
import { KinesisStream } from './subscribers/KinesisStream';

/**
 * Subscribe all Cloudwatch Log Groups on the environment to given subsccription
 * service such as kinesis stream, kinesis firehose or Lambda.
 * the script will create kenisis stream and create the role and set the policies.
 * check all existing Cloudwatch subscriptions and add kenisis subscription to all
 * the log streams.
 */
export class SubscriberFactory {
  public region: string;
  public streamName: string;
  public roleName;
  public policyName;
  public logGroupNamePrefix = '/aws/lambda/';
  private iAm: any;
  private kinesis: any;
  private cloudWatchLogs: any;

  constructor({
    region,
    streamName,
    logGroupNamePrefix,
    roleName = 'CWLtoKinesisRole',
    policyName = 'Permissions-Policy-For-CWL',
  }: {
    region: SubscriberFactory['region'],
    streamName: SubscriberFactory['streamName'],
    roleName?: string,
    policyName?: string;
    logGroupNamePrefix?: string;
  }) {
    this.region = region;
    this.streamName = streamName;
    this.roleName = roleName;
    this.policyName = policyName;
    this.logGroupNamePrefix += logGroupNamePrefix;

    if (!region) {
      throw new NotFoundError({
        title: 'aws region not set',
        detail: 'aws region not set',
      });
    }
    if (!streamName) {
      throw new NotFoundError({
        title: 'kinesis stream name not set',
        detail: 'kinesis stream name not set',
      });
    }

    /**
     * Initialise aws sdk
     */
    this.iAm = new IAM({
      apiVersion: '2010-05-08',
      region,
    });
    this.kinesis = new Kinesis({
      apiVersion: '2013-12-02',
      region,
    });
    this.cloudWatchLogs = new CloudWatchLogs({
      apiVersion: '2014-03-28',
      region,
    });
  }

  /**
   * Create required stack role and policies,
   * Loop throuh the cloudwatch log groups assign subscriptions to each.
   *
   */
  /*eslint no-console: "error"*/
  public async subscribe() {
    console.log('Initialising Cloud Watch Subscription ...');
    console.log(`Checking kinesis stream ${this.streamName}`);

    const SubscriberResource = await this.getSubscriber('kinesis');

    await SubscriberResource.initialise();

    console.log(`Requesting Subscriber ARN ...`);

    const StreamARN = await SubscriberResource.getServiceArn();

    /**
     * get Cloud watch log groups
     *
     * max limit is 50
     */
    const cloudWatchLogGroups = await this.getAllCloudWatchLogGroups({
      limit: 50,
      logGroupNamePrefix: this.logGroupNamePrefix,
    });

    try {
      await this.iAm.getRole({
        RoleName: this.roleName,
      }).promise();
    } catch (e) {
      const Service = `logs.${this.region}.amazonaws.com`;

      const roleAssumeDocument = {
        Statement: {
          Effect: 'Allow',
          Principal: { Service },
          Action: 'sts:AssumeRole',
        },
      };

      console.log(`Creating role : ${this.roleName} ...`);

      await this.iAm.createRole({
        RoleName: this.roleName,
        AssumeRolePolicyDocument: JSON.stringify(roleAssumeDocument),
        Path: '/',
      })
        .promise()
        .catch((err) => {
          throw new InternalError(err);
        });

      /**
       * check if the iam role exists
       */
      await waitForStack({
        waitFor: async (): Promise<any> => {

          return await this.iAm.getRole({
            RoleName: this.roleName,
          },
          ).promise();
        },
        delayTime: 1000,
        timeout: 10000,
      },
      );
    }

    const {
      Role: {
        Arn,
      },
    } = await this.iAm.getRole({
        RoleName: this.roleName,
      }).promise()
        .catch((err) => {
          throw new InternalError(err);
        });

    console.log(`Role check successfull for: ${this.roleName} arn: ${Arn}`);

    const rolePolicyDocument = {
      Statement: [
        {
          Effect: 'Allow',
          Action: 'kinesis:PutRecord',
          Resource: StreamARN,
        },
        {
          Effect: 'Allow',
          Action: 'iam:PassRole',
          Resource: Arn,
        },
      ],
    };

    console.log(`Attaching Policy ${this.policyName} to the role : ${this.roleName} ...`);

    await this.iAm.putRolePolicy({
      RoleName: this.roleName,
      PolicyDocument: JSON.stringify(rolePolicyDocument),
      PolicyName: this.policyName,
    }).promise()
      .catch((err) => {
        throw new NotFoundError(err);
      });
    console.log(`Policy ${this.policyName} successfully attached to the role: ${this.roleName}\n`);
    console.log(`Deleting existing subscriptions from log groups to Kinesis Stream: ${this.streamName}...`);

    /**
     * cloudwatch subscription filter functionality
     */
    const deleteSubscriptionFilter = async (deleteSubscriptionFilterParams: object): Promise<any> => {
      await this.cloudWatchLogs.deleteSubscriptionFilter(deleteSubscriptionFilterParams)
        .promise()
        .catch((err) => {
          throw new NotFoundError(err);
        });
    };

    const describeSubscriptionFilter = async (describeSubscriptionFilterParams: object): Promise<any> => {

      return this.cloudWatchLogs.describeSubscriptionFilters(describeSubscriptionFilterParams).promise()
        .catch((err) => {
          throw new NotFoundError(err);
        });
    };

    const putSubscriptionFilter = async (putSubscriptionFilterParams: object): Promise<any> => {
      await this.cloudWatchLogs.putSubscriptionFilter(putSubscriptionFilterParams).promise()
        .catch((err) => {
          throw new InternalError(err);
        });
    };

    /**
     * Check Log subscriptions for Kinesis stream and delete if exists.
     */
    await map(cloudWatchLogGroups, async (group: any) => {
      try {
        if (await describeSubscriptionFilter({ logGroupName: group.logGroupName })) {
          await deleteSubscriptionFilter({
            filterName: `cwlfilter-${group.logGroupName.replace('/aws/lambda/', '')}`,
            logGroupName: group.logGroupName,
          });
          console.log(`deleted log group subscription: ${group.logGroupName}`);
        }
      } catch (e) {
        console.log(`Subscription does not exist for the log group: ${group.logGroupName}`);
      }
    }, { concurrency: 2 })
      .delay(100);

    console.log('Complete clearing subscriptions on log groups \n');

    /**
     * Add log stream subscriptions to given Kinesis Stream
     */
    console.log(`Subscribing log groups to Kinesis Stream: ${this.streamName}...`);
    await map(cloudWatchLogGroups, async (group: any) => {
      try {
        await putSubscriptionFilter({
          destinationArn: StreamARN,
          filterName: `cwlfilter-${group.logGroupName.replace('/aws/lambda/', '')}`,
          filterPattern: '',
          logGroupName: group.logGroupName,
          roleArn: 'arn:aws:iam::937688626168:role/CWLtoKinesisRole',
          distribution: 'ByLogStream',
        });
        console.log(`Successfully Subscribed log group : ${group.logGroupName}`);
      } catch (error) {
        console.log(`Error subscribing log group: ${group.logGroupName}`);
      }
    }, { concurrency: 1 })
      .delay(200);

    console.log('Compleate adding subscriptions to log groups.');
  }

  /**
   * Loop though and return all the Cloudwatch log streams
   *
   * @param params
   */
  private async getAllCloudWatchLogGroups(params: any): Promise<any> {
    const describeParam = params;
    let clwLogGroups = [];
    let looping = true;
    while (looping) {
      const clwLogGroup = await this.cloudWatchLogs.describeLogGroups(describeParam).promise();
      clwLogGroups = clwLogGroups.concat(clwLogGroup.logGroups);
      if (!clwLogGroup.nextToken) {
        looping = false;
      }
      describeParam.nextToken = clwLogGroup.nextToken;
    }

    return clwLogGroups;
  }

  /**
   * Initialise and Get the Subscription Resource
   *
   * @param {string} type type of the subscriber service
   * @return {*} subscriberResource Kinesis Stream | Kinesis Firehourse | Lambda
   */
  private getSubscriber(type: string): any {
    let subscriberResource: any;
    switch (type) {
      case 'kinesis':
        subscriberResource = new KinesisStream({
          region: this.region,
          streamName: this.streamName,
        });
        break;

      /**
       * @todo Add implimentation of the subscriber services to support to the pluggin
       */

      // case 'kinesis-firehose'
        // subscriberResource = new KinesisStream({
        //   region: this.region,
        //   streamName: this.streamName,
        // });
        // break;
      // case 'lambda'
        // subscriberResource = new KinesisStream({
        //   region: this.region,
        //   streamName: this.streamName,
        // });
        // break;
    }

    return subscriberResource;
  }

}
