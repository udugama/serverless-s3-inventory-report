"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const AWS_SDK = require("aws-sdk");
const AWS = require("aws-sdk-mock");
const aws_response_1 = require("./fixture/aws-response");
describe('deploment/cloudFormation/CredentialsStack [Integration]', () => {
    beforeAll(() => __awaiter(this, void 0, void 0, function* () {
        AWS.setSDKInstance(AWS_SDK);
    }));
    it('check wether subscription class function as expected', () => __awaiter(this, void 0, void 0, function* () {
        /**
         * kinesis stream mock
         */
        AWS.mock('Kinesis', 'describeStream', ({ QueueName }, callback) => {
            callback(null, aws_response_1.streamDescription);
        });
        /**
         * I am getRole mock
         */
        AWS.mock('IAM', 'getRole', ({ RoleName }, callback) => {
            callback(null, aws_response_1.iAmGetRoleResponse);
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
            callback(null, aws_response_1.cloudWatchLogGroupsDescribeResponse);
        });
        AWS.mock('CloudWatchLogs', 'describeSubscriptionFilters', ({ params }, callback) => {
            callback(null, aws_response_1.describeSubscriptionFilterResponse);
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
            yield subscriber.subscribe();
        }
        catch (error) {
            console.log(error);
        }
    }));
});
