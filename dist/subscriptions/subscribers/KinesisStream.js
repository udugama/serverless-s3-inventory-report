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
/**
 * Class Kinesis Stream
 * Creates and initialises Kinesis stream to be subscribed by the SubscriberFactory
 */
const errors_1 = require("@temando/errors");
const aws_sdk_1 = require("aws-sdk");
const WaitForStack_1 = require("./../lib/WaitForStack");
class KinesisStream {
    constructor({ region, streamName, }) {
        this.region = region;
        this.streamName = streamName;
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
        this.kinesis = new aws_sdk_1.Kinesis({
            apiVersion: '2013-12-02',
            region,
        });
    }
    initialise() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.describeKinesisStream(this.streamName);
                console.log(`Kenisis Stream ${this.streamName} exists in the environment.`);
            }
            catch (e) {
                console.log(`Kenisis Stream ${this.streamName} does not exists.`);
                console.log(`Creating kinesis stream ${this.streamName} ...`);
                yield this.kinesis.createStream({
                    ShardCount: 1,
                    StreamName: this.streamName,
                }).promise()
                    .catch((err) => {
                    throw new errors_1.InternalError(err);
                });
                /**
                 * check wether stream status `ACTIVE`
                 */
                yield WaitForStack_1.waitForStack({
                    waitFor: () => __awaiter(this, void 0, void 0, function* () {
                        const { StreamDescription: { StreamStatus, }, } = yield this.describeKinesisStream(this.streamName);
                        /**
                         * if the stream not active it will throw `service not avalable` `503` error
                         */
                        if (StreamStatus !== 'ACTIVE') {
                            throw new errors_1.TemandoError({
                                status: '503',
                                title: 'Stream service not avalable, initialising.',
                                detail: 'Stream service not avalable, initialising.',
                            });
                        }
                        return true;
                    }),
                    delayTime: 1000,
                    timeout: 40000,
                });
                console.log(`Successfully created kinesis stream ${this.streamName}\n`);
            }
        });
    }
    /**
     * Describe Kinesis Stream and Return the ARN
     *
     * @param {string} StreamName
     * @return {string} StreamARN
     */
    getServiceArn() {
        return __awaiter(this, void 0, void 0, function* () {
            const { StreamDescription: { StreamARN, }, } = yield this.describeKinesisStream(this.streamName);
            console.log(`Kinesis stream ARN : ${StreamARN}\n`);
            return StreamARN;
        });
    }
    /**
     * Describe kinesis streem
     *
     * @param {string} StreamName
     * @return {object} kinesis stream describe response
     */
    describeKinesisStream(StreamName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.kinesis.describeStream({ StreamName })
                .promise()
                .catch((err) => {
                throw new errors_1.NotFoundError(err);
            });
        });
    }
}
exports.KinesisStream = KinesisStream;
