## Example serverless.yml configeration for the s3 inventory report

```custom:
  S3InventoryReportConfiguration:
    Id: myreport-${self:provider.stage}-${self:provider.region}
    Bucket: bucket-${self:provider.stage}-${self:provider.region}
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
      Bucket: arn:aws:s3:::mybucket-mystage-eu-west-1-inventory # destination bucket arn
      Format: CSV
      Prefix: inventory
      # AccountId: '2342343242423' # [optional] provide if destination bucket belongs to external account
      # Encryption: {
      #   SSEKMS:
      #     KeyId: 'string' |
      #   SSES3  # [optional]```
      

  ## Deploy Commands:

      please execute following command during deployment `serverless s3inventoryReport --region <AWS Region>` 

