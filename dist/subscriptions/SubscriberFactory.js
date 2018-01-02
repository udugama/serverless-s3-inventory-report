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
const errors_1 = require("@temando/errors");
const aws_sdk_1 = require("aws-sdk");
const bluebird_1 = require("bluebird");
const WaitForStack_1 = require("./lib/WaitForStack");
const KinesisStream_1 = require("./subscribers/KinesisStream");
/**
 * Subscribe all Cloudwatch Log Groups on the environment to given kinesis stream.
 * the script will create kenisis stream and create the role and set the policies.
 * check all existing Cloudwatch subscriptions and add kenisis subscription to all
 * the log streams.
 */
class SubscriberFactory {
    constructor({ region, streamName, logGroupNamePrefix, roleName = 'CWLtoKinesisRole', policyName = 'Permissions-Policy-For-CWL', }) {
        this.logGroupNamePrefix = '/aws/lambda/';
        this.region = region;
        this.streamName = streamName;
        this.roleName = roleName;
        this.policyName = policyName;
        this.logGroupNamePrefix += logGroupNamePrefix;
        if (!region) {
            throw new errors_1.NotFoundError({
                title: 'aws region not set',
                detail: 'aws region not set',
            });
        }
        if (!streamName) {
            throw new errors_1.NotFoundError({
                title: 'kinesis stream name not set',
                detail: 'kinesis stream name not set',
            });
        }
        /**
         * Initialise aws sdk
         */
        this.iAm = new aws_sdk_1.IAM({
            apiVersion: '2010-05-08',
            region,
        });
        this.kinesis = new aws_sdk_1.Kinesis({
            apiVersion: '2013-12-02',
            region,
        });
        this.cloudWatchLogs = new aws_sdk_1.CloudWatchLogs({
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
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Initialising Cloud Watch Subscription ...');
            console.log(`Checking kinesis stream ${this.streamName}`);
            const SubscriberResource = yield this.getSubscriber('kinesis');
            yield SubscriberResource.initialise();
            // try {
            //   await this.describeKinesisStream({
            //     StreamName: this.streamName,
            //   });
            //   console.log(`Kenisis Stream ${this.streamName} exists in the environment.`);
            // } catch (e) {
            //   console.log(`Kenisis Stream ${this.streamName} does not exists.`);
            //   console.log(`Creating kinesis stream ${this.streamName} ...`);
            //   await this.kinesis.createStream({
            //     ShardCount: 1,
            //     StreamName: this.streamName,
            //   }).promise()
            //     .catch((err) => {
            //       throw new InternalError(err);
            //     });
            //   /**
            //    * check wether stream status `ACTIVE`
            //    */
            //   await waitForStack({
            //     waitFor: async () => {
            //       const {
            //         StreamDescription: {
            //           StreamStatus,
            //         },
            //       } = await this.describeKinesisStream({
            //         StreamName: this.streamName,
            //       });
            //       /**
            //        * if the stream not active it will throw `service not avalable` `503` error
            //        */
            //       if (StreamStatus !== 'ACTIVE') {
            //         throw new TemandoError({
            //           status: '503',
            //           title: 'Stream service not avalable, initialising.',
            //           detail: 'Stream service not avalable, initialising.',
            //         });
            //       }
            //       return true;
            //     },
            //     delayTime: 1000,
            //     timeout: 40000,
            //   },
            //   );
            //   console.log(`Successfully created kinesis stream ${this.streamName}\n`);
            // }
            console.log(`Requesting kinesis stream ARN ...`);
            // const {
            //   StreamDescription: {
            //     StreamARN,
            //   },
            // } = await this.describeKinesisStream({ StreamName: this.streamName });
            // console.log(`Kinesis stream ARN : ${StreamARN}\n`);
            const StreamARN = yield SubscriberResource.getServiceArn();
            console.log('----------------');
            console.log(StreamARN);
            console.log('----------------');
            /**
             * get Cloud watch log groups
             *
             * max limit is 50
             */
            const cloudWatchLogGroups = yield this.getAllCloudWatchLogGroups({
                limit: 50,
                logGroupNamePrefix: this.logGroupNamePrefix,
            });
            try {
                yield this.iAm.getRole({
                    RoleName: this.roleName,
                }).promise();
            }
            catch (e) {
                const Service = `logs.${this.region}.amazonaws.com`;
                const roleAssumeDocument = {
                    Statement: {
                        Effect: 'Allow',
                        Principal: { Service },
                        Action: 'sts:AssumeRole',
                    },
                };
                console.log(`Creating role : ${this.roleName} ...`);
                yield this.iAm.createRole({
                    RoleName: this.roleName,
                    AssumeRolePolicyDocument: JSON.stringify(roleAssumeDocument),
                    Path: '/',
                })
                    .promise()
                    .catch((err) => {
                    throw new errors_1.InternalError(err);
                });
                /**
                 * check if the iam role exists
                 */
                yield WaitForStack_1.waitForStack({
                    waitFor: () => __awaiter(this, void 0, void 0, function* () {
                        return yield this.iAm.getRole({
                            RoleName: this.roleName,
                        }).promise();
                    }),
                    delayTime: 1000,
                    timeout: 10000,
                });
            }
            const { Role: { Arn, }, } = yield this.iAm.getRole({
                RoleName: this.roleName,
            }).promise()
                .catch((err) => {
                throw new errors_1.InternalError(err);
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
            yield this.iAm.putRolePolicy({
                RoleName: this.roleName,
                PolicyDocument: JSON.stringify(rolePolicyDocument),
                PolicyName: this.policyName,
            }).promise()
                .catch((err) => {
                throw new errors_1.NotFoundError(err);
            });
            console.log(`Policy ${this.policyName} successfully attached to the role: ${this.roleName}\n`);
            console.log(`Deleting existing subscriptions from log groups to Kinesis Stream: ${this.streamName}...`);
            /**
             * cloudwatch subscription filter functionality
             */
            const deleteSubscriptionFilter = (deleteSubscriptionFilterParams) => __awaiter(this, void 0, void 0, function* () {
                yield this.cloudWatchLogs.deleteSubscriptionFilter(deleteSubscriptionFilterParams)
                    .promise()
                    .catch((err) => {
                    throw new errors_1.NotFoundError(err);
                });
            });
            const describeSubscriptionFilter = (describeSubscriptionFilterParams) => __awaiter(this, void 0, void 0, function* () {
                return this.cloudWatchLogs.describeSubscriptionFilters(describeSubscriptionFilterParams).promise()
                    .catch((err) => {
                    throw new errors_1.NotFoundError(err);
                });
            });
            const putSubscriptionFilter = (putSubscriptionFilterParams) => __awaiter(this, void 0, void 0, function* () {
                yield this.cloudWatchLogs.putSubscriptionFilter(putSubscriptionFilterParams).promise()
                    .catch((err) => {
                    throw new errors_1.InternalError(err);
                });
            });
            /**
             * Check Log subscriptions for Kinesis stream and delete if exists.
             */
            yield bluebird_1.map(cloudWatchLogGroups, (group) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (yield describeSubscriptionFilter({ logGroupName: group.logGroupName })) {
                        yield deleteSubscriptionFilter({
                            filterName: `cwlfilter-${group.logGroupName.replace('/aws/lambda/', '')}`,
                            logGroupName: group.logGroupName,
                        });
                        console.log(`deleted log group subscription: ${group.logGroupName}`);
                    }
                }
                catch (e) {
                    console.log(`Subscription does not exist for the log group: ${group.logGroupName}`);
                }
            }), { concurrency: 2 })
                .delay(100);
            console.log('Complete clearing subscriptions on log groups \n');
            /**
             * Add log stream subscriptions to given Kinesis Stream
             */
            console.log(`Subscribing log groups to Kinesis Stream: ${this.streamName}...`);
            yield bluebird_1.map(cloudWatchLogGroups, (group) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield putSubscriptionFilter({
                        destinationArn: StreamARN,
                        filterName: `cwlfilter-${group.logGroupName.replace('/aws/lambda/', '')}`,
                        filterPattern: '',
                        logGroupName: group.logGroupName,
                        roleArn: 'arn:aws:iam::937688626168:role/CWLtoKinesisRole',
                        distribution: 'ByLogStream',
                    });
                    console.log(`Successfully Subscribed log group : ${group.logGroupName}`);
                }
                catch (error) {
                    console.log(`Error subscribing log group: ${group.logGroupName}`);
                }
            }), { concurrency: 1 })
                .delay(200);
            console.log('Compleate adding subscriptions to log groups.');
        });
    }
    // /**
    //  * Describe kinesis streem
    //  *
    //  * @param params
    //  */
    // private async describeKinesisStream(params: object): Promise<any> {
    //   return this.kinesis.describeStream(params)
    //     .promise()
    //     .catch((err) => {
    //       throw new NotFoundError(err);
    //     });
    // }
    // /**
    //  * poll aws api till the resource is ready.
    //  *
    //  * @param delayTime
    //  * @param timeout
    //  * @param waitFor
    //  */
    // private async waitForStack({ waitFor, delayTime = 1000, timeout = 10000 }: {
    //   waitFor: any,
    //   delayTime: number,
    //   timeout: number;
    // }) {
    //   const startTime = Date.now();
    //   while ((startTime + timeout) > Date.now()) {
    //     try {
    //       await waitFor();
    //       return;
    //     } catch (err) {
    //       await delay(delayTime);
    //     }
    //   }
    //   throw new TemandoError({
    //     status: '408',
    //     title: `AWS resource timeout of ${timeout} milliseconds exceeded.`,
    //     detail: `AWS resource timeout of ${timeout} milliseconds exceeded.`,
    //   });
    // }
    /**
     * Loop though and return all the Cloudwatch log streams
     *
     * @param params
     */
    getAllCloudWatchLogGroups(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const describeParam = params;
            let clwLogGroups = [];
            let looping = true;
            while (looping) {
                const clwLogGroup = yield this.cloudWatchLogs.describeLogGroups(describeParam).promise();
                clwLogGroups = clwLogGroups.concat(clwLogGroup.logGroups);
                if (!clwLogGroup.nextToken) {
                    looping = false;
                }
                describeParam.nextToken = clwLogGroup.nextToken;
            }
            return clwLogGroups;
        });
    }
    /**
     * resourse
     */
    getSubscriber(type) {
        let subscriberResource;
        switch (type) {
            case 'kinesis':
                subscriberResource = new KinesisStream_1.KinesisStream({
                    region: this.region,
                    streamName: this.streamName,
                });
                break;
        }
        return subscriberResource;
    }
}
exports.SubscriberFactory = SubscriberFactory;
