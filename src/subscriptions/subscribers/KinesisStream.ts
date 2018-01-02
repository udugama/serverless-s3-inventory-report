/**
 * Class Kinesis Stream
 * Creates and initialises Kinesis stream to be subscribed by the SubscriberFactory
 */
import {
  InternalError,
  NotFoundError,
  TemandoError,
} from '@temando/errors';
import { Kinesis } from 'aws-sdk';
import { waitForStack } from './../lib/WaitForStack';

export class KinesisStream {
  private kinesis: Kinesis;
  private region: string;
  private streamName: string;

  constructor({
    region,
    streamName,
  }: {
    region: KinesisStream['region'],
    streamName: KinesisStream['streamName'];
  }) {
    this.region = region;
    this.streamName = streamName;

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

    this.kinesis = new Kinesis({
      apiVersion: '2013-12-02',
      region,
    });
  }

  public async initialise() {
    try {
        await this.describeKinesisStream(this.streamName);
        console.log(`Kenisis Stream ${this.streamName} exists in the environment.`);
    } catch (e) {
      console.log(`Kenisis Stream ${this.streamName} does not exists.`);
      console.log(`Creating kinesis stream ${this.streamName} ...`);

      await this.kinesis.createStream({
        ShardCount: 1,
        StreamName: this.streamName,
      }).promise()
        .catch((err) => {
          throw new InternalError(err);
        });

      /**
       * check wether stream status `ACTIVE`
       */
      await waitForStack({
        waitFor: async () => {
          const {
            StreamDescription: {
              StreamStatus,
            },
          } = await this.describeKinesisStream(this.streamName);
          /**
           * if the stream not active it will throw `service not avalable` `503` error
           */
          if (StreamStatus !== 'ACTIVE') {
            throw new TemandoError({
              status: '503',
              title: 'Stream service not avalable, initialising.',
              detail: 'Stream service not avalable, initialising.',
            });
          }

          return true;
        },
        delayTime: 1000,
        timeout: 40000,
      },
      );

      console.log(`Successfully created kinesis stream ${this.streamName}\n`);
    }
  }

  /**
   * Describe Kinesis Stream and Return the ARN
   *
   * @param {string} StreamName
   * @return {string} StreamARN
   */
  public async getServiceArn(): Promise<any> {
    const {
      StreamDescription: {
        StreamARN,
      },
    } = await this.describeKinesisStream(this.streamName);
    console.log(`Kinesis stream ARN : ${StreamARN}\n`);

    return StreamARN;
  }

  /**
   * Describe kinesis streem
   *
   * @param {string} StreamName
   * @return {object} kinesis stream describe response
   */
  private async describeKinesisStream(StreamName: string): Promise<any> {

    return this.kinesis.describeStream({ StreamName })
      .promise()
      .catch((err) => {
        throw new NotFoundError(err);
      });
  }
}
