## Intro

The `serverless-s3-inventory-report` plugin creates s3 inventory report in a chosen s3 bucket and will also configure destination for the generated report.

The plugin also able to create inventory report in buckets that are external to the stack.


## Install Plugin

  Install plugin with following command ```npm install serverless-s3-inventory-report```.

  Install plugin and save in package.json  ```npm install serverless-s3-inventory-report --save``` or  ```npm install serverless-s3-inventory-report --save-dev``` to save as dev dependency.

## Example serverless.yml configuration for the s3 inventory report

add following `custom` configuration to the `serverless.yml` file

```
custom:
  S3InventoryReportConfiguration:
    Id: myreport-mystage-myregion
    Bucket: bucket-mystage-myregion
    Schedule:
      Frequency: Daily # Daily | Weekly [required] freequency of the inventory report
    IncludedObjectVersions: All  # All | Current [required] object versions 
    IsEnabled: true # true || false [required]
    # Filter:
    #   Prefix: inventory-report # [optional] prefix in the s3 for the inventory report
    OptionalFields:
      - Size
      - LastModifiedDate
      - StorageClass
      - ETag
      - IsMultipartUploaded
      - ReplicationStatus
      - EncryptionStatus
    Destination:
      Bucket: arn:aws:s3:::mybucket-mystage-myregion-inventory # destination bucket arn
      Format: ORC # format can be ORC or CSV
      Prefix: inventory # prefix for the generated report object
      # AccountId: '2342343242423' # [optional] only provide if destination bucket belongs to external account
      # Encryption:
      #   SSEKMS:
      #     KeyId: 'string' |
      #   SSES3  # [optional]
```
      

## Deploy Commands

   Please execute following command during deployment `serverless s3inventoryReport --region <AWS Region>`

   Note: Please make sure the s3 bucket resources provisioned before executing the plugin.

