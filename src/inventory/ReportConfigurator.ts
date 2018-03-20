import { S3, STS } from 'aws-sdk';

/**
 * Create S3 Inventory Report according to the given configeration
 */
export class ReportConfigurator {
  private s3: S3;
  private sts: STS;
  private serverless: any;

  constructor({
    region,
    serverless,
  }: {
    region: string;
    serverless: ReportConfigurator['serverless'];
  }) {
    if (!region) {
      throw new Error('Please provide a AWS region!');
    }

    this.serverless = serverless;

    this.sts = new STS({
      apiVersion: '2011-06-15',
      region,
    });

    this.s3 = new S3({
      apiVersion: '2006-03-01',
      region,
    });
  }

  public async configure() {

    /**
     * get AWS Account Id
     */
    const { Account }: any = await this.sts.getCallerIdentity().promise()
     .catch((error) => {
       console.log('ERROR: ', error);
    });

    const {
      S3InventoryReportConfiguration: {
        Id,
        Bucket,
        OptionalFields,
        Schedule,
        IsEnabled,
        IncludedObjectVersions,
        Filter,
        Destination: {
          Format,
          Bucket: BucketArn,
          Prefix,
          Encryption,
        // AccountId = Account,
        },
      },
    } = this.serverless.service.custom;

    const params: any = {
      Bucket,
      Id,
      InventoryConfiguration: {
        Destination: {
          S3BucketDestination: {
            Bucket: BucketArn,
            Format,
            AccountId: Account,
            // Encryption: {
            //   SSEKMS: {
            //     KeyId: 'sdfsdfsdfdsf',
            //   },
            //   SSES3: {
            //   },
            // },
            Prefix,
          },
        },
        Id,
        IncludedObjectVersions,
        IsEnabled,
        Schedule,
        OptionalFields,
      },
    };

    if (Filter) {
      params.InventoryConfiguration.Filter = Filter;
    }

    if (Encryption) {
      params.InventoryConfiguration.Encryption = Encryption;
    }

    await this.s3.putBucketInventoryConfiguration(params)
    .promise()
      .catch((error) => {
        console.log('ERROR: ', error);
      });

    console.log(`SUCCESSFULLY CREATED S3 INVETORY REPORT ${Id} INTO BUCKET ${Bucket}`);
  }
}
