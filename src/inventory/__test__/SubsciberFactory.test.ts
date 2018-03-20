import * as AWS_SDK from 'aws-sdk';
import * as AWS from 'aws-sdk-mock';
import {
  cloudWatchLogGroupsDescribeResponse,
  describeSubscriptionFilterResponse,
  iAmGetRoleResponse,
  streamDescription,
} from './fixture/aws-response';

describe('deploment/cloudFormation/CredentialsStack [Integration]', () => {
  beforeAll(async () => {
    AWS.setSDKInstance(AWS_SDK);
  });

  it('check wether subscription class function as expected', async () => {
    /**
     * kinesis stream mock
     */
    AWS.mock('Kinesis', 'describeStream', ({ QueueName }, callback) => {
      callback(null, streamDescription);
    });

    /**
     * I am getRole mock
     */
    AWS.mock('IAM', 'getRole', ({ RoleName }, callback) => {
      callback(null, iAmGetRoleResponse);
    });

    /**
     * I am putRolePolicy mock
     */
    AWS.mock('IAM', 'putRolePolicy', ({ PolicyName }, callback) => {
      callback(null, {});
    });

    /**
     * Cloudwatch get log groups subscription mock
     */
    AWS.mock('CloudWatchLogs', 'describeLogGroups', ({ params }, callback) => {
      callback(null, cloudWatchLogGroupsDescribeResponse);
    });

    AWS.mock('CloudWatchLogs', 'describeSubscriptionFilters', ({ params }, callback) => {
      callback(null, describeSubscriptionFilterResponse);
    });

    AWS.mock('CloudWatchLogs', 'deleteSubscriptionFilter', ({ params }, callback) => {
      callback(null, {});
    });

    AWS.mock('CloudWatchLogs', 'putSubscriptionFilter', ({ params }, callback) => {
      callback(null, {});
    });

    /**
     * require after the mocking (cannot do a import)
     */
    const { SubscriberFactory } = require('./../SubscriberFactory');
    const subscriber = new SubscriberFactory({ region: 'region', streamName: 'splunk-phxstage' });
    try {
      await subscriber.subscribe();
    } catch (error) {
      console.log(error);
    }
  });
});
